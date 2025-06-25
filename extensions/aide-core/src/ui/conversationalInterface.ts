import * as vscode from 'vscode';
import { AgentManager } from '../agents/agentManager';
import { MemoryGraph } from '../memory/memoryGraph';
import { createLogger } from '../services/loggerService';

/**
 * Conversational Interface for AIDE
 * Provides a full-screen chat interface for AI-native development
 */
export class ConversationalInterface {
	private panel: vscode.WebviewPanel | undefined;
	private agentManager: AgentManager;
	private memoryGraph: MemoryGraph;
	private readonly logger = createLogger('ConversationalInterface');

	constructor(agentManager: AgentManager, memoryGraph: MemoryGraph) {
		this.agentManager = agentManager;
		this.memoryGraph = memoryGraph;
	}

	/**
	 * Shows the conversational interface in a full-screen webview
	 */
	public show(context: vscode.ExtensionContext): void {
		const columnToShowIn = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (this.panel) {
			this.panel.reveal(columnToShowIn);
			return;
		}

		this.panel = vscode.window.createWebviewPanel(
			'aideChat',
			'AIDE - AI Development Environment',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'src', 'ui', 'assets')],
			}
		);

		this.panel.webview.html = this.getWebviewContent();
		this.setupMessageHandlers();

		this.panel.onDidDispose(
			() => {
				this.panel = undefined;
			},
			null,
			context.subscriptions
		);
	}

	/**
	 * Sends a message to the webview
	 */
	public sendMessage(message: any): void {
		if (this.panel) {
			this.panel.webview.postMessage(message);
		}
	}

	/**
	 * Sets up message handlers for webview communication
	 */
	private setupMessageHandlers(): void {
		this.panel!.webview.onDidReceiveMessage(async message => {
			switch (message.type) {
				case 'sendMessage':
					await this.handleUserMessage(message.text);
					break;
				case 'clearHistory':
					await this.clearConversationHistory();
					break;
				case 'exportHistory':
					await this.exportConversationHistory();
					break;
				case 'showMemoryGraph':
					await this.showMemoryVisualization();
					break;
				case 'selectProjectType':
					await this.handleProjectTypeSelection(message.projectType);
					break;
			}
		});
	}
	/**
	 * Handles user messages and routes them to appropriate agents
	 */
	private async handleUserMessage(text: string): Promise<void> {
		try {
			// Add user message to memory
			const userNodeId = this.memoryGraph.addNode('intent', text, {
				role: 'user',
				timestamp: new Date().toISOString(),
			});

			// Show typing indicator
			this.sendMessage({
				type: 'typing',
				isTyping: true,
			});

			// Process message through agent manager
			const responses = await this.agentManager.processMessage(text);

			// Process each response (typically there will be one main response)
			for (const response of responses) {
				// Add AI response to memory
				const aiNodeId = this.memoryGraph.addNode('intent', response.message, {
					role: 'assistant',
					agent: response.agent,
					timestamp: new Date().toISOString(),
				});

				// Connect user message to AI response
				this.memoryGraph.addEdge(userNodeId, aiNodeId, 'relates_to');

				// Send response to UI
				this.sendMessage({
					type: 'message',
					content: response.message,
					agent: response.agent,
					actions: response.actions?.map(action => action.type) || [],
					timestamp: new Date().toISOString(),
				});
			}

			// Hide typing indicator
			this.sendMessage({
				type: 'typing',
				isTyping: false,
			});
		} catch (error) {
			this.logger.error('Error handling user message:', error);
			this.sendMessage({
				type: 'error',
				message: 'An error occurred while processing your message.',
			});

			// Hide typing indicator on error
			this.sendMessage({
				type: 'typing',
				isTyping: false,
			});
		}
	}

	/**
	 * Clears conversation history
	 */
	private async clearConversationHistory(): Promise<void> {
		// Clear memory graph
		this.memoryGraph.clear();

		// Notify UI
		this.sendMessage({
			type: 'historyCleared',
		});

		vscode.window.showInformationMessage('Conversation history cleared.');
	}
	/**
	 * Exports conversation history
	 */
	private async exportConversationHistory(): Promise<void> {
		const graphData = this.memoryGraph.getGraphData();
		const messageNodes = graphData.nodes.filter(
			node => node.metadata.role === 'user' || node.metadata.role === 'assistant'
		);

		const history = messageNodes
			.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
			.map(node => ({
				role: node.metadata.role,
				content: node.content,
				agent: node.metadata.agent || 'user',
				timestamp: node.timestamp,
			}));

		const exportData = JSON.stringify(history, null, 2);

		const uri = await vscode.window.showSaveDialog({
			defaultUri: vscode.Uri.file('aide-conversation-history.json'),
			filters: {
				'JSON Files': ['json'],
			},
		});

		if (uri) {
			await vscode.workspace.fs.writeFile(uri, Buffer.from(exportData));
			vscode.window.showInformationMessage('Conversation history exported successfully.');
		}
	}

	/**
	 * Shows memory visualization
	 */
	private async showMemoryVisualization(): Promise<void> {
		// This will be implemented with the memory visualization component
		vscode.commands.executeCommand('aide.showMemoryVisualization');
	}

	/**
	 * Starts an interactive project creation flow
	 */
	public async startProjectCreationFlow(): Promise<void> {
		if (!this.panel) {
			// Open the conversational interface first
			const activeEditor = vscode.window.activeTextEditor;
			const context = activeEditor?.document.uri.fsPath
				? { uri: activeEditor.document.uri }
				: ({} as vscode.ExtensionContext);
			this.show(context as vscode.ExtensionContext);
		}

		// Send a special message to start the project creation flow
		this.sendMessage({
			type: 'startProjectFlow',
			message: "Welcome to AIDE Project Creation! Let's build something amazing together.",
			options: [
				{
					id: 'web-app',
					label: '🌐 Web Application',
					description: 'Modern web app with React/Next.js',
				},
				{
					id: 'mobile-app',
					label: '📱 Mobile App',
					description: 'Cross-platform mobile app with React Native',
				},
				{ id: 'api', label: '🔌 API Service', description: 'RESTful API with Node.js/Express' },
				{
					id: 'desktop-app',
					label: '💻 Desktop App',
					description: 'Desktop application with Electron',
				},
				{ id: 'custom', label: '✨ Custom Project', description: 'Tell me what you want to build' },
			],
		});
	}

	/**
	 * Handles the selection of a project type during the creation flow
	 */
	private async handleProjectTypeSelection(projectType: string): Promise<void> {
		try {
			// Add the project selection to memory
			const selectionNodeId = this.memoryGraph.addNode(
				'decision',
				`Project type selected: ${projectType}`,
				{
					role: 'user',
					timestamp: new Date().toISOString(),
					projectType: projectType,
				}
			);

			// Show typing indicator
			this.sendMessage({
				type: 'typing',
				isTyping: true,
			});

			// Process the project type and generate appropriate response
			let response = '';
			let nextSteps: string[] = [];

			switch (projectType) {
				case 'web-app':
					response = `Great choice! 🌐 Let's create a modern web application. I'll help you set up a project with the latest frameworks and best practices.

**What I'll set up for you:**
- ⚛️ React or Next.js framework
- 🎨 Tailwind CSS for styling
- 📦 TypeScript for type safety
- 🔧 Modern build tools (Vite/Next.js)
- 🧪 Testing setup (Jest/Vitest)
- 📝 Documentation and README

**Next steps:**
1. Choose your preferred framework (React, Next.js, or Vue)
2. Select additional features (authentication, database, etc.)
3. Set up project structure and dependencies
4. Create initial components and pages`;
					nextSteps = [
						'Choose Framework',
						'Add Authentication',
						'Setup Database',
						'Create Components',
					];
					break;

				case 'mobile-app':
					response = `Excellent! 📱 Let's build a cross-platform mobile app. I'll guide you through creating a modern mobile application.

**What I'll set up for you:**
- 📱 React Native or Expo framework
- 🎨 Native UI components
- 📦 TypeScript for development
- 🔧 Development tools and debugging
- 🧪 Testing framework
- 📱 Platform-specific configurations

**Next steps:**
1. Choose React Native or Expo
2. Select target platforms (iOS, Android, or both)
3. Configure navigation and state management
4. Set up native features (camera, location, etc.)`;
					nextSteps = [
						'Choose Framework',
						'Select Platforms',
						'Add Navigation',
						'Configure Features',
					];
					break;

				case 'api':
					response = `Perfect! 🔌 Let's create a robust API service. I'll help you build a scalable and well-documented API.

**What I'll set up for you:**
- 🚀 Node.js with Express or Fastify
- 📦 TypeScript for type safety
- 🗄️ Database integration (PostgreSQL, MongoDB, etc.)
- 🔐 Authentication and authorization
- 📚 API documentation (Swagger/OpenAPI)
- 🧪 Testing suite and validation

**Next steps:**
1. Choose your runtime and framework
2. Select database and ORM
3. Design API endpoints and schemas
4. Implement authentication and middleware`;
					nextSteps = [
						'Choose Framework',
						'Select Database',
						'Design Endpoints',
						'Add Authentication',
					];
					break;

				case 'desktop-app':
					response = `Awesome! 💻 Let's create a desktop application. I'll help you build a cross-platform desktop app with modern web technologies.

**What I'll set up for you:**
- ⚡ Electron or Tauri framework
- ⚛️ React/Vue frontend
- 🎨 Modern UI framework
- 📦 TypeScript development
- 🔧 Build and packaging tools
- 🧪 Testing and debugging setup

**Next steps:**
1. Choose desktop framework (Electron vs Tauri)
2. Select frontend framework and UI library
3. Configure native integrations
4. Set up build and distribution`;
					nextSteps = ['Choose Framework', 'Select Frontend', 'Add Native Features', 'Setup Build'];
					break;

				case 'custom':
					response = `Fantastic! ✨ I love custom projects! Tell me more about what you'd like to build.

**I can help you with:**
- 🎯 Any programming language or framework
- 🏗️ Architecture design and planning
- 📦 Dependency management and tooling
- 🧪 Testing strategies
- 🚀 Deployment and CI/CD
- 📚 Documentation and best practices

**Please describe your project:**
- What type of application or system?
- What technologies do you prefer?
- Any specific requirements or constraints?
- Who is your target audience?`;
					nextSteps = [
						'Describe Project',
						'Choose Technologies',
						'Plan Architecture',
						'Start Development',
					];
					break;

				default:
					response = `I'm not sure about that project type. Could you please select one of the available options or choose "Custom Project" to describe what you'd like to build?`;
					nextSteps = ['Try Again'];
			}

			// Hide typing indicator
			this.sendMessage({
				type: 'typing',
				isTyping: false,
			});

			// Send the response message
			const assistantNodeId = this.memoryGraph.addNode(
				'feature',
				`Project plan for ${projectType}`,
				{
					role: 'assistant',
					timestamp: new Date().toISOString(),
					agent: 'PlannerAgent',
					projectType: projectType,
					nextSteps: nextSteps,
					response: response,
				}
			);

			// Link the nodes in memory
			this.memoryGraph.addEdge(selectionNodeId, assistantNodeId, 'relates_to');

			// Send the message to the UI
			this.sendMessage({
				content: response,
				role: 'assistant',
				agent: 'PlannerAgent',
				timestamp: new Date().toISOString(),
				actions: nextSteps,
			});

			// If it's a custom project, wait for user input
			if (projectType === 'custom') {
				// No additional action needed - wait for user to describe their project
				return;
			}

			// For predefined project types, we can start the detailed configuration
			await this.startDetailedProjectConfiguration(projectType);
		} catch (error) {
			this.logger.error('Error handling project type selection:', error);

			// Hide typing indicator
			this.sendMessage({
				type: 'typing',
				isTyping: false,
			});

			// Send error message
			this.sendMessage({
				type: 'error',
				message:
					'Sorry, there was an error processing your project type selection. Please try again.',
			});
		}
	}

	/**
	 * Starts detailed configuration for a specific project type
	 */
	private async startDetailedProjectConfiguration(projectType: string): Promise<void> {
		// This will be expanded to handle detailed project configuration
		// For now, we'll delegate to the appropriate agent
		try {
			const agentResponses = await this.agentManager.processMessage(
				`Start detailed configuration for ${projectType} project`,
				{ projectType: projectType, phase: 'configuration' }
			);

			if (agentResponses && agentResponses.length > 0) {
				// Use the first response (typically from PlannerAgent)
				const primaryResponse = agentResponses[0];

				this.sendMessage({
					content: primaryResponse.message,
					role: 'assistant',
					agent: primaryResponse.agent,
					timestamp: new Date().toISOString(),
					actions: primaryResponse.actions?.map(action => action.type) || [],
				});
			}
		} catch (error) {
			this.logger.error('Error in detailed project configuration:', error);
			this.sendMessage({
				content: `Let's continue with your ${projectType} project. What specific features would you like me to help you implement first?`,
				role: 'assistant',
				agent: 'PlannerAgent',
				timestamp: new Date().toISOString(),
			});
		}
	}

	/**
	 * Generates the HTML content for the webview
	 */
	private getWebviewContent(): string {
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>AIDE - AI Development Environment</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: var(--vscode-editor-background);
			color: var(--vscode-editor-foreground);
			height: 100vh;
			display: flex;
			flex-direction: column;
		}

		.header {
			background: var(--vscode-titleBar-activeBackground);
			color: var(--vscode-titleBar-activeForeground);
			padding: 12px 20px;
			border-bottom: 1px solid var(--vscode-panel-border);
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		.header h1 {
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
			border-radius: 3px;
			cursor: pointer;
			font-size: 12px;
		}

		.btn:hover {
			background: var(--vscode-button-hoverBackground);
		}

		.btn-secondary {
			background: var(--vscode-button-secondaryBackground);
			color: var(--vscode-button-secondaryForeground);
		}

		.btn-secondary:hover {
			background: var(--vscode-button-secondaryHoverBackground);
		}

		.chat-container {
			flex: 1;
			display: flex;
			flex-direction: column;
			overflow: hidden;
		}

		.messages {
			flex: 1;
			overflow-y: auto;
			padding: 20px;
			display: flex;
			flex-direction: column;
			gap: 16px;
		}

		.message {
			max-width: 80%;
			padding: 12px 16px;
			border-radius: 8px;
			word-wrap: break-word;
		}

		.message.user {
			align-self: flex-end;
			background: var(--vscode-inputValidation-infoBorder);
			color: var(--vscode-editor-background);
		}

		.message.assistant {
			align-self: flex-start;
			background: var(--vscode-editor-selectionBackground);
		}

		.message-header {
			font-size: 12px;
			opacity: 0.8;
			margin-bottom: 4px;
		}

		.message-content {
			line-height: 1.5;
		}

		.message-actions {
			margin-top: 8px;
			display: flex;
			gap: 8px;
			flex-wrap: wrap;
		}

		.action-btn {
			background: var(--vscode-badge-background);
			color: var(--vscode-badge-foreground);
			border: none;
			padding: 4px 8px;
			border-radius: 3px;
			cursor: pointer;
			font-size: 11px;
		}

		.action-btn:hover {
			opacity: 0.8;
		}

		.input-area {
			border-top: 1px solid var(--vscode-panel-border);
			padding: 16px 20px;
			background: var(--vscode-editor-background);
		}

		.input-container {
			display: flex;
			gap: 12px;
			align-items: flex-end;
		}

		.input-field {
			flex: 1;
			background: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 4px;
			padding: 12px;
			font-size: 14px;
			resize: vertical;
			min-height: 44px;
			max-height: 200px;
			font-family: inherit;
		}

		.input-field:focus {
			outline: none;
			border-color: var(--vscode-focusBorder);
		}

		.send-btn {
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			padding: 12px 20px;
			border-radius: 4px;
			cursor: pointer;
			font-weight: 600;
		}

		.send-btn:hover:not(:disabled) {
			background: var(--vscode-button-hoverBackground);
		}

		.send-btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.typing-indicator {
			align-self: flex-start;
			padding: 12px 16px;
			background: var(--vscode-editor-selectionBackground);
			border-radius: 8px;
			opacity: 0.8;
		}

		.typing-dots {
			display: flex;
			gap: 4px;
		}

		.typing-dot {
			width: 6px;
			height: 6px;
			background: var(--vscode-editor-foreground);
			border-radius: 50%;
			animation: typing 1.4s infinite;
		}

		.typing-dot:nth-child(2) {
			animation-delay: 0.2s;
		}

		.typing-dot:nth-child(3) {
			animation-delay: 0.4s;
		}

		@keyframes typing {
			0%, 60%, 100% {
				opacity: 0.3;
			}
			30% {
				opacity: 1;
			}
		}

		.welcome-message {
			text-align: center;
			padding: 40px 20px;
			opacity: 0.8;
		}

		.welcome-message h2 {
			margin-bottom: 16px;
			font-size: 24px;
			font-weight: 300;
		}
		.welcome-message p {
			font-size: 14px;
			line-height: 1.6;
			max-width: 600px;
			margin: 0 auto;
		}

		.project-options {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
			gap: 16px;
			margin: 20px 0;
			max-width: 800px;
		}

		.project-option {
			background: var(--vscode-editor-selectionBackground);
			border: 1px solid var(--vscode-panel-border);
			border-radius: 8px;
			padding: 20px;
			cursor: pointer;
			transition: all 0.2s ease;
			text-align: left;
		}

		.project-option:hover {
			background: var(--vscode-list-hoverBackground);
			border-color: var(--vscode-focusBorder);
			transform: translateY(-2px);
		}

		.project-option-icon {
			font-size: 24px;
			margin-bottom: 12px;
			display: block;
		}

		.project-option-title {
			font-weight: 600;
			font-size: 16px;
			margin-bottom: 8px;
			color: var(--vscode-editor-foreground);
		}

		.project-option-description {
			font-size: 14px;
			opacity: 0.8;
			line-height: 1.4;
		}

		.project-flow-message {
			background: var(--vscode-notifications-background);
			border: 1px solid var(--vscode-notifications-border);
			border-radius: 8px;
			padding: 20px;
			margin: 16px 0;
		}

		.project-flow-title {
			font-size: 18px;
			font-weight: 600;
			margin-bottom: 16px;
			color: var(--vscode-editor-foreground);
		}
	</style>
</head>
<body>
	<div class="header">
		<h1>🤖 AIDE - AI Development Environment</h1>
		<div class="header-actions">
			<button class="btn btn-secondary" onclick="showMemoryGraph()">Memory Graph</button>
			<button class="btn btn-secondary" onclick="exportHistory()">Export</button>
			<button class="btn btn-secondary" onclick="clearHistory()">Clear</button>
		</div>
	</div>

	<div class="chat-container">
		<div class="messages" id="messages">
			<div class="welcome-message">
				<h2>Welcome to AIDE</h2>
				<p>
					Your AI-native development environment is ready. Ask me to create projects, build features,
					design interfaces, write tests, or deploy applications. I'm here to help you build amazing software!
				</p>
			</div>
		</div>

		<div class="input-area">
			<div class="input-container">
				<textarea
					class="input-field"
					id="messageInput"
					placeholder="What would you like to build today?"
					rows="1"
				></textarea>
				<button class="send-btn" id="sendBtn" onclick="sendMessage()">Send</button>
			</div>
		</div>
	</div>

	<script>
		const vscode = acquireVsCodeApi();
		const messagesContainer = document.getElementById('messages');
		const messageInput = document.getElementById('messageInput');
		const sendBtn = document.getElementById('sendBtn');
		// Handle messages from extension
		window.addEventListener('message', event => {
			const message = event.data;

			switch (message.type) {
				case 'message':
					addMessage(message);
					break;
				case 'typing':
					handleTypingIndicator(message.isTyping);
					break;
				case 'error':
					addErrorMessage(message.message);
					break;
				case 'historyCleared':
					clearMessages();
					break;
				case 'startProjectFlow':
					showProjectCreationFlow(message);
					break;
			}
		});

		// Auto-resize textarea
		messageInput.addEventListener('input', function() {
			this.style.height = 'auto';
			this.style.height = Math.min(this.scrollHeight, 200) + 'px';
		});

		// Send message on Enter (but allow Shift+Enter for new line)
		messageInput.addEventListener('keydown', function(e) {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				sendMessage();
			}
		});

		function sendMessage() {
			const text = messageInput.value.trim();
			if (!text) return;

			// Add user message to UI
			addMessage({
				content: text,
				role: 'user',
				timestamp: new Date().toISOString()
			});

			// Send to extension
			vscode.postMessage({
				type: 'sendMessage',
				text: text
			});

			// Clear input
			messageInput.value = '';
			messageInput.style.height = 'auto';
			sendBtn.disabled = true;
		}

		function addMessage(message) {
			// Remove welcome message if it exists
			const welcome = messagesContainer.querySelector('.welcome-message');
			if (welcome) {
				welcome.remove();
			}

			const messageDiv = document.createElement('div');
			messageDiv.className = \`message \${message.role || 'assistant'}\`;

			let actionsHtml = '';
			if (message.actions && message.actions.length > 0) {
				actionsHtml = '<div class="message-actions">' +
					message.actions.map(action =>
						\`<button class="action-btn" onclick="executeAction('\${action}')">\${action}</button>\`
					).join('') +
					'</div>';
			}

			messageDiv.innerHTML = \`
				<div class="message-header">
					\${message.agent ? \`🤖 \${message.agent}\` : '👤 You'} • \${formatTime(message.timestamp)}
				</div>
				<div class="message-content">\${escapeHtml(message.content)}</div>
				\${actionsHtml}
			\`;

			messagesContainer.appendChild(messageDiv);
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
			sendBtn.disabled = false;
		}

		function addErrorMessage(text) {
			const messageDiv = document.createElement('div');
			messageDiv.className = 'message assistant';
			messageDiv.innerHTML = \`
				<div class="message-header">⚠️ Error</div>
				<div class="message-content">\${escapeHtml(text)}</div>
			\`;
			messagesContainer.appendChild(messageDiv);
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
			sendBtn.disabled = false;
		}

		function handleTypingIndicator(isTyping) {
			const existingIndicator = messagesContainer.querySelector('.typing-indicator');

			if (isTyping && !existingIndicator) {
				const indicator = document.createElement('div');
				indicator.className = 'typing-indicator';
				indicator.innerHTML = \`
					<div class="typing-dots">
						<div class="typing-dot"></div>
						<div class="typing-dot"></div>
						<div class="typing-dot"></div>
					</div>
				\`;
				messagesContainer.appendChild(indicator);
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			} else if (!isTyping && existingIndicator) {
				existingIndicator.remove();
			}
		}

		function clearMessages() {
			messagesContainer.innerHTML = \`
				<div class="welcome-message">
					<h2>Welcome to AIDE</h2>
					<p>
						Your AI-native development environment is ready. Ask me to create projects, build features,
						design interfaces, write tests, or deploy applications. I'm here to help you build amazing software!
					</p>
				</div>
			\`;
		}

		function clearHistory() {
			vscode.postMessage({ type: 'clearHistory' });
		}

		function exportHistory() {
			vscode.postMessage({ type: 'exportHistory' });
		}

		function showMemoryGraph() {
			vscode.postMessage({ type: 'showMemoryGraph' });
		}
		function executeAction(action) {
			vscode.postMessage({
				type: 'sendMessage',
				text: action
			});
		}

		function showProjectCreationFlow(message) {
			// Remove welcome message if it exists
			const welcome = messagesContainer.querySelector('.welcome-message');
			if (welcome) {
				welcome.remove();
			}

			// Create project flow message
			const flowDiv = document.createElement('div');
			flowDiv.className = 'project-flow-message';

			flowDiv.innerHTML = \`
				<div class="project-flow-title">🚀 \${message.message}</div>
				<div class="project-options">
					\${message.options.map(option => \`
						<div class="project-option" onclick="selectProjectType('\${option.id}')">
							<span class="project-option-icon">\${option.label.split(' ')[0]}</span>
							<div class="project-option-title">\${option.label.substring(2)}</div>
							<div class="project-option-description">\${option.description}</div>
						</div>
					\`).join('')}
				</div>
			\`;

			messagesContainer.appendChild(flowDiv);
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}

		function selectProjectType(projectType) {
			// Send project type selection to extension
			vscode.postMessage({
				type: 'selectProjectType',
				projectType: projectType
			});

			// Add user selection message to UI
			addMessage({
				content: \`I'd like to create a \${getProjectTypeName(projectType)} project.\`,
				role: 'user',
				timestamp: new Date().toISOString()
			});

			// Remove the project flow message
			const flowMessage = messagesContainer.querySelector('.project-flow-message');
			if (flowMessage) {
				flowMessage.remove();
			}
		}

		function getProjectTypeName(projectType) {
			const names = {
				'web-app': 'Web Application',
				'mobile-app': 'Mobile App',
				'api': 'API Service',
				'desktop-app': 'Desktop App',
				'custom': 'Custom Project'
			};
			return names[projectType] || projectType;
		}

		function formatTime(timestamp) {
			return new Date(timestamp).toLocaleTimeString();
		}

		function escapeHtml(text) {
			const div = document.createElement('div');
			div.textContent = text;
			return div.innerHTML.replace(/\\n/g, '<br>');
		}

		// Focus input on load
		messageInput.focus();
	</script>
</body>
</html>`;
	}
}
