/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { AgentRuntime } from '@codai/agent-runtime';
import { MemoryGraphEngine } from '@codai/memory-graph';

/**
 * AI-Native Conversational Interface Panel
 * Full-screen chat interface for conversational development
 */
export class ConversationPanel implements vscode.WebviewViewProvider {
	public static readonly viewType = 'aide.conversation';
	private _view?: vscode.WebviewView;

	constructor(
		private readonly _context: vscode.ExtensionContext,
		private readonly memoryGraph?: MemoryGraphEngine,
		private readonly agentRuntime?: AgentRuntime
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,
			localResourceRoots: [
				this._context.extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// Handle messages from the webview
		webviewView.webview.onDidReceiveMessage(
			async (data) => {
				switch (data.type) {
					case 'sendMessage':
						await this.handleUserMessage(data.message);
						break;
					case 'newProject':
						await this.handleNewProject(data.projectDetails);
						break;
					case 'deployProject':
						await this.handleDeployment(data.platform);
						break;
					case 'showMemoryGraph':
						await this.showMemoryGraph();
						break;
					case 'getProjectStatus':
						await this.sendProjectStatus();
						break;
					case 'openSettings':
						await this.openSettings();
						break;
					case 'exportProject':
						await this.exportProject(data.format);
						break;
				}
			},
			undefined,
			this._context.subscriptions
		);

		// Setup real-time updates from agents
		this.setupAgentUpdates();

		// Send initial state
		this.sendWelcomeMessage();
	}

	private async handleUserMessage(message: string) {
		if (!this.agentRuntime || !this.memoryGraph) {
			this.sendMessage({
				type: 'agentResponse',
				content: 'AIDE is initializing. Please wait a moment...',
				timestamp: new Date(),
				agent: 'system'
			});
			return;
		}

		try {
			// Send message to agent runtime for processing
			const taskId = `task-${Date.now()}`; const task = {
				id: taskId,
				title: 'Process User Request',
				description: message,
				agentId: 'planner', // Start with planner agent
				status: 'pending' as const,
				priority: 'medium' as const,
				inputs: { userMessage: message },
				progress: 0,
				createdAt: new Date()
			};

			// Show typing indicator
			this.sendMessage({
				type: 'agentTyping',
				agent: 'planner',
				timestamp: new Date()
			});

			// Execute task through agent runtime
			const result = await this.agentRuntime.executeTask(task);			// Send agent response
			this.sendMessage({
				type: 'agentResponse',
				content: (result.outputs?.response as string) || 'I\'ve processed your request.',
				timestamp: new Date(),
				agent: 'planner',
				metadata: {
					taskId: taskId,
					confidence: (result.outputs?.confidence as number) || 0.8,
					suggestions: (result.outputs?.suggestions as string[]) || []
				}
			});			// If the task resulted in code generation or project changes, update the preview
			if (result.outputs?.projectChanges) {
				this.sendMessage({
					type: 'projectUpdate',
					changes: result.outputs.projectChanges as any,
					timestamp: new Date()
				});
			}

		} catch (error) {
			this.sendMessage({
				type: 'agentResponse',
				content: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
				timestamp: new Date(),
				agent: 'system',
				isError: true
			});
		}
	}

	private async handleNewProject(projectDetails: any) {
		if (!this.agentRuntime) {
			return;
		}
		try {
			const task = {
				id: `project-${Date.now()}`,
				title: 'Create New Project',
				description: `Create a new project: ${projectDetails.name}`,
				agentId: 'planner',
				status: 'pending' as const,
				priority: 'high' as const,
				inputs: { projectDetails },
				progress: 0,
				createdAt: new Date()
			};

			this.sendMessage({
				type: 'projectCreationStarted',
				projectName: projectDetails.name,
				timestamp: new Date()
			});

			const result = await this.agentRuntime.executeTask(task); this.sendMessage({
				type: 'projectCreated',
				project: result.outputs?.project as any,
				timestamp: new Date()
			});

		} catch (error) {
			this.sendMessage({
				type: 'error',
				message: `Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`,
				timestamp: new Date()
			});
		}
	}

	private async handleDeployment(platform: string) {
		if (!this.agentRuntime) {
			return;
		}

		try {
			const task = {
				id: `deploy-${Date.now()}`,
				title: 'Deploy Project',
				description: `Deploy to ${platform}`,
				agentId: 'deployer',
				status: 'pending' as const,
				priority: 'high' as const,
				inputs: { platform },
				progress: 0,
				createdAt: new Date()
			};

			this.sendMessage({
				type: 'deploymentStarted',
				platform,
				timestamp: new Date()
			});

			const result = await this.agentRuntime.executeTask(task); this.sendMessage({
				type: 'deploymentCompleted',
				platform,
				url: (result.outputs?.deploymentUrl as string) || 'https://deployment-url.com',
				timestamp: new Date()
			});

		} catch (error) {
			this.sendMessage({
				type: 'deploymentFailed',
				platform,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date()
			});
		}
	}

	private async showMemoryGraph() {
		// Trigger memory graph panel to open
		vscode.commands.executeCommand('aide.showMemoryGraph');
	}
	private async sendProjectStatus() {
		if (!this.memoryGraph) {
			return;
		}

		const graph = this.memoryGraph.currentGraph;
		const status = {
			nodes: graph.nodes.length,
			relationships: graph.relationships.length,
			lastUpdated: graph.updatedAt,
			projectType: graph.projectType
		};

		this.sendMessage({
			type: 'projectStatus',
			status,
			timestamp: new Date()
		});
	}

	private async openSettings() {
		vscode.commands.executeCommand('aide.openSettings');
	}

	private async exportProject(format: string) {
		if (!this.memoryGraph) {
			return;
		}
		try {
			// Export project in specified format
			const graph = this.memoryGraph.currentGraph;
			let exportData: string;

			switch (format) {
				case 'json':
					exportData = JSON.stringify(graph, null, 2);
					break;
				case 'yaml':
					// Would need yaml library for this
					exportData = JSON.stringify(graph, null, 2);
					break;
				default:
					throw new Error(`Unsupported export format: ${format}`);
			}

			// Save to file
			const uri = await vscode.window.showSaveDialog({
				defaultUri: vscode.Uri.file(`${graph.name}.${format}`),
				filters: {
					[format.toUpperCase()]: [format]
				}
			});

			if (uri) {
				await vscode.workspace.fs.writeFile(uri, Buffer.from(exportData, 'utf8'));
				this.sendMessage({
					type: 'projectExported',
					format,
					path: uri.fsPath,
					timestamp: new Date()
				});
			}

		} catch (error) {
			this.sendMessage({
				type: 'error',
				message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
				timestamp: new Date()
			});
		}
	}

	private setupAgentUpdates() {
		if (!this.agentRuntime) {
			return;
		}
		// Listen to agent runtime events
		this.agentRuntime.messages$.subscribe(message => {
			this.sendMessage({
				...message,
				type: 'agentMessage',
				timestamp: new Date()
			});
		});

		this.agentRuntime.tasks$.subscribe(taskEvent => {
			this.sendMessage({
				...taskEvent,
				type: 'taskUpdate',
				timestamp: new Date()
			});
		});
	}

	private sendWelcomeMessage() {
		this.sendMessage({
			type: 'welcome',
			content: `Welcome to AIDE! 👋

I'm your AI development partner. You can:
• Describe what you want to build and I'll create it
• Ask me to add features or make changes
• Deploy to web, mobile, or desktop platforms
• View your project's memory graph and timeline

What would you like to create today?`,
			timestamp: new Date(),
			agent: 'aide'
		});

		// Send current capabilities
		this.sendMessage({
			type: 'capabilities',
			capabilities: {
				memoryGraph: !!this.memoryGraph,
				agentRuntime: !!this.agentRuntime,
				deployment: true,
				collaboration: true
			},
			timestamp: new Date()
		});
	}

	private sendMessage(message: any) {
		if (this._view) {
			this._view.webview.postMessage(message);
		}
	}

	public show() {
		if (this._view) {
			this._view.show?.(true);
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>AIDE Conversation</title>
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			margin: 0;
			padding: 0;
			height: 100vh;
			display: flex;
			flex-direction: column;
			background: var(--vscode-editor-background);
			color: var(--vscode-editor-foreground);
		}

		.header {
			padding: 16px 20px;
			border-bottom: 1px solid var(--vscode-panel-border);
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		.header h1 {
			margin: 0;
			font-size: 18px;
			font-weight: 600;
		}

		.header-actions {
			display: flex;
			gap: 8px;
		}

		.btn {
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			padding: 6px 12px;
			border-radius: 4px;
			cursor: pointer;
			font-size: 12px;
		}

		.btn:hover {
			background: var(--vscode-button-hoverBackground);
		}

		.conversation {
			flex: 1;
			overflow-y: auto;
			padding: 20px;
			display: flex;
			flex-direction: column;
			gap: 16px;
		}

		.message {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.message.user {
			align-items: flex-end;
		}

		.message.agent {
			align-items: flex-start;
		}

		.message-bubble {
			max-width: 80%;
			padding: 12px 16px;
			border-radius: 16px;
			line-height: 1.4;
		}

		.message.user .message-bubble {
			background: var(--vscode-textLink-foreground);
			color: white;
		}

		.message.agent .message-bubble {
			background: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border);
		}

		.message-meta {
			font-size: 11px;
			color: var(--vscode-descriptionForeground);
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.agent-name {
			background: var(--vscode-badge-background);
			color: var(--vscode-badge-foreground);
			padding: 2px 6px;
			border-radius: 10px;
			font-size: 10px;
			font-weight: 500;
		}

		.input-container {
			padding: 16px 20px;
			border-top: 1px solid var(--vscode-panel-border);
			display: flex;
			gap: 12px;
			align-items: flex-end;
		}

		.input-area {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		#messageInput {
			background: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 8px;
			padding: 12px;
			font-size: 14px;
			min-height: 40px;
			max-height: 120px;
			resize: vertical;
			font-family: inherit;
		}

		#messageInput:focus {
			outline: none;
			border-color: var(--vscode-focusBorder);
		}

		.quick-actions {
			display: flex;
			gap: 8px;
			flex-wrap: wrap;
		}

		.quick-action {
			background: var(--vscode-button-secondaryBackground);
			color: var(--vscode-button-secondaryForeground);
			border: none;
			padding: 4px 8px;
			border-radius: 12px;
			cursor: pointer;
			font-size: 11px;
		}

		.quick-action:hover {
			background: var(--vscode-button-secondaryHoverBackground);
		}

		.send-btn {
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			padding: 12px 16px;
			border-radius: 8px;
			cursor: pointer;
			font-weight: 500;
		}

		.send-btn:hover {
			background: var(--vscode-button-hoverBackground);
		}

		.send-btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.typing-indicator {
			display: flex;
			align-items: center;
			gap: 8px;
			color: var(--vscode-descriptionForeground);
			font-style: italic;
		}

		.typing-dots {
			display: flex;
			gap: 2px;
		}

		.typing-dot {
			width: 4px;
			height: 4px;
			background: var(--vscode-descriptionForeground);
			border-radius: 50%;
			animation: typing 1.4s ease-in-out infinite;
		}

		.typing-dot:nth-child(2) { animation-delay: 0.2s; }
		.typing-dot:nth-child(3) { animation-delay: 0.4s; }

		@keyframes typing {
			0%, 60%, 100% { opacity: 0.3; }
			30% { opacity: 1; }
		}

		.error-message {
			background: var(--vscode-errorBackground);
			color: var(--vscode-errorForeground);
			border: 1px solid var(--vscode-errorBorder);
		}

		.status-bar {
			padding: 8px 20px;
			background: var(--vscode-statusBar-background);
			color: var(--vscode-statusBar-foreground);
			border-top: 1px solid var(--vscode-panel-border);
			font-size: 12px;
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		.hidden { display: none; }
	</style>
</head>
<body>
	<div class="header">
		<h1>🤖 AIDE</h1>
		<div class="header-actions">
			<button class="btn" onclick="showMemoryGraph()">Memory Graph</button>
			<button class="btn" onclick="openSettings()">Settings</button>
		</div>
	</div>

	<div class="conversation" id="conversation">
		<!-- Messages will be inserted here -->
	</div>

	<div class="typing-indicator hidden" id="typingIndicator">
		<span class="agent-name" id="typingAgent">Agent</span>
		<span>is thinking</span>
		<div class="typing-dots">
			<div class="typing-dot"></div>
			<div class="typing-dot"></div>
			<div class="typing-dot"></div>
		</div>
	</div>

	<div class="input-container">
		<div class="input-area">
			<div class="quick-actions">
				<button class="quick-action" onclick="quickAction('new project')">New Project</button>
				<button class="quick-action" onclick="quickAction('add feature')">Add Feature</button>
				<button class="quick-action" onclick="quickAction('deploy to web')">Deploy</button>
				<button class="quick-action" onclick="quickAction('run tests')">Test</button>
			</div>
			<textarea
				id="messageInput"
				placeholder="Describe what you want to build or ask me anything..."
				onkeydown="handleKeyDown(event)"
			></textarea>
		</div>
		<button class="send-btn" onclick="sendMessage()" id="sendBtn">Send</button>
	</div>

	<div class="status-bar">
		<span id="statusText">Ready</span>
		<span id="projectInfo">No project loaded</span>
	</div>

	<script>
		const vscode = acquireVsCodeApi();
		let isTyping = false;

		function sendMessage() {
			const input = document.getElementById('messageInput');
			const message = input.value.trim();

			if (!message || isTyping) return;

			// Add user message to conversation
			addMessage(message, 'user');

			// Clear input
			input.value = '';

			// Send to extension
			vscode.postMessage({
				type: 'sendMessage',
				message: message
			});
		}

		function quickAction(action) {
			const input = document.getElementById('messageInput');
			input.value = action;
			sendMessage();
		}

		function addMessage(content, sender, metadata = {}) {
			const conversation = document.getElementById('conversation');
			const messageDiv = document.createElement('div');
			messageDiv.className = \`message \${sender}\`;

			const bubble = document.createElement('div');
			bubble.className = \`message-bubble \${metadata.isError ? 'error-message' : ''}\`;
			bubble.textContent = content;

			const meta = document.createElement('div');
			meta.className = 'message-meta';

			if (sender === 'agent') {
				const agentName = document.createElement('span');
				agentName.className = 'agent-name';
				agentName.textContent = metadata.agent || 'AIDE';
				meta.appendChild(agentName);
			}

			const time = document.createElement('span');
			time.textContent = new Date().toLocaleTimeString();
			meta.appendChild(time);

			messageDiv.appendChild(bubble);
			messageDiv.appendChild(meta);
			conversation.appendChild(messageDiv);

			// Scroll to bottom
			conversation.scrollTop = conversation.scrollHeight;
		}

		function showTyping(agent) {
			const indicator = document.getElementById('typingIndicator');
			const agentSpan = document.getElementById('typingAgent');
			agentSpan.textContent = agent || 'AIDE';
			indicator.classList.remove('hidden');
			isTyping = true;
			document.getElementById('sendBtn').disabled = true;
		}

		function hideTyping() {
			const indicator = document.getElementById('typingIndicator');
			indicator.classList.add('hidden');
			isTyping = false;
			document.getElementById('sendBtn').disabled = false;
		}

		function updateStatus(text) {
			document.getElementById('statusText').textContent = text;
		}

		function updateProjectInfo(info) {
			document.getElementById('projectInfo').textContent = info;
		}

		function handleKeyDown(event) {
			if (event.key === 'Enter' && !event.shiftKey) {
				event.preventDefault();
				sendMessage();
			}
		}

		function showMemoryGraph() {
			vscode.postMessage({ type: 'showMemoryGraph' });
		}

		function openSettings() {
			vscode.postMessage({ type: 'openSettings' });
		}

		// Handle messages from extension
		window.addEventListener('message', event => {
			const message = event.data;

			switch (message.type) {
				case 'welcome':
					addMessage(message.content, 'agent', { agent: message.agent });
					break;

				case 'agentResponse':
					hideTyping();
					addMessage(message.content, 'agent', {
						agent: message.agent,
						isError: message.isError
					});
					break;

				case 'agentTyping':
					showTyping(message.agent);
					break;

				case 'projectStatus':
					updateProjectInfo(\`\${message.status.nodes} nodes, \${message.status.relationships} connections\`);
					break;

				case 'taskUpdate':
					updateStatus(\`\${message.task?.title || 'Task'}: \${message.type}\`);
					break;

				case 'error':
					hideTyping();
					addMessage(message.message, 'agent', { isError: true });
					break;

				default:
					console.log('Unhandled message type:', message.type);
			}
		});

		// Request initial project status
		setTimeout(() => {
			vscode.postMessage({ type: 'getProjectStatus' });
		}, 1000);
	</script>
</body>
</html>`;
	}
}
