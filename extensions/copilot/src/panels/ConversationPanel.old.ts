/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { AgentRuntime, SettingsManager } from '@codai/agent-runtime';
import { MemoryGraphEngine } from '@codai/memory-graph';

/**
 * AI-Native Conversational Interface Panel
 * Full-screen chat interface for conversational development
 */
export class ConversationPanel implements vscode.WebviewViewProvider {
	public static readonly viewType = 'aide.conversation';
	private _view?: vscode.WebviewView;
	constructor(
		private context: vscode.ExtensionContext,
		private memoryGraph: MemoryGraphEngine,
		private agentRuntime: any // Use any type for optional AgentRuntime
	) {
		// Subscribe to agent messages if agentRuntime is available
		if (this.agentRuntime && this.agentRuntime.messages$) {
			this.agentRuntime.messages$.subscribe((message: any) => {
				this.postMessage({
					type: 'agent_message',
					data: message,
				});
			});
		}

		// Subscribe to memory graph changes
		this.memoryGraph.changes$.subscribe(change => {
			this.postMessage({
				type: 'graph_change',
				data: change,
			});
		});
	}

	public show(): void {
		if (this.panel) {
			this.panel.reveal();
			return;
		}
		this.panel = vscode.window.createWebviewPanel(
			'aide.conversation',
			'AIDE Conversation',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [
					vscode.Uri.file(this.context.asAbsolutePath('dist')),
					vscode.Uri.file(this.context.asAbsolutePath('assets')),
				],
			}
		);

		this.panel.webview.html = this.getWebviewContent();
		this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
		// Handle messages from webview
		this.panel.webview.onDidReceiveMessage(
			async message => {
				switch (message.type) {
					case 'user_message':
						await this.handleUserMessage(message.data);
						break;
					case 'create_project':
						await this.handleCreateProject(message.data);
						break;
					case 'request_state':
						await this.sendCurrentState();
						break;
					case 'test_agent_runtime':
						await this.handleTestAgentRuntime();
						break;
				}
			},
			null,
			this.disposables
		);

		this.sendCurrentState();
	}
	private async handleUserMessage(message: { content: string; conversationId?: string }) {
		const conversationId = message.conversationId || 'default';

		try {
			// Check if agentRuntime is available
			if (!this.agentRuntime || !this.agentRuntime.executeTask) {
				this.postMessage({
					type: 'error',
					data: { message: 'Agent runtime not available yet. Please wait for initialization.' },
				});
				return;
			}

			// Start conversation task with planner agent
			const task = await this.agentRuntime.executeTask({
				id: this.generateId(),
				title: 'Process User Request',
				description: message.content,
				agentId: 'planner',
				status: 'pending',
				priority: 'high',
				inputs: {
					userInput: message.content,
					conversationId,
					currentGraph: this.memoryGraph.currentGraph,
				},
				createdAt: new Date(),
				progress: 0,
			});

			this.postMessage({
				type: 'task_started',
				data: { taskId: task.id, message: 'Processing your request...' },
			});
		} catch (error) {
			this.postMessage({
				type: 'error',
				data: { message: `Error processing request: ${error}` },
			});
		}
	}
	private async handleCreateProject(data: { name: string; description: string; type: string }) {
		try {
			// Check if agentRuntime is available
			if (!this.agentRuntime || !this.agentRuntime.executeTask) {
				this.postMessage({
					type: 'error',
					data: { message: 'Agent runtime not available yet. Please wait for initialization.' },
				});
				return;
			}

			const task = await this.agentRuntime.executeTask({
				id: this.generateId(),
				title: 'Create New Project',
				description: `Create a new ${data.type} project: ${data.name}`,
				agentId: 'planner',
				status: 'pending',
				priority: 'high',
				inputs: data,
				createdAt: new Date(),
				progress: 0,
			});

			this.postMessage({
				type: 'project_creation_started',
				data: { taskId: task.id, projectName: data.name },
			});
		} catch (error) {
			this.postMessage({
				type: 'error',
				data: { message: `Error creating project: ${error}` },
			});
		}
	}
	private async sendCurrentState() {
		const state = {
			graph: this.memoryGraph.currentGraph,
			activeConversations:
				this.agentRuntime && this.agentRuntime.conversations
					? Array.from(this.agentRuntime.conversations.keys())
					: [],
			activeTasks:
				this.agentRuntime && this.agentRuntime.activeTasks
					? Array.from(this.agentRuntime.activeTasks.values())
					: [],
		};

		this.postMessage({
			type: 'state_update',
			data: state,
		});
	}

	private postMessage(message: any) {
		if (this.panel) {
			this.panel.webview.postMessage(message);
		}
	}

	private generateId(): string {
		return Math.random().toString(36).substr(2, 9);
	}
	private getWebviewContent(): string {
		// Use fallback approach for older VS Code API versions
		const scriptPath = this.context.asAbsolutePath('dist/conversation.js');
		const stylePath = this.context.asAbsolutePath('dist/conversation.css');

		const scriptUri = vscode.Uri.file(scriptPath).toString();
		const styleUri = vscode.Uri.file(stylePath).toString();

		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>AIDE Conversation</title>
			<link href="${styleUri}" rel="stylesheet">
			<style>
				* {
					box-sizing: border-box;
					margin: 0;
					padding: 0;
				}

				body {
					font-family: var(--vscode-font-family);
					color: var(--vscode-foreground);
					background-color: var(--vscode-editor-background);
					height: 100vh;
					display: flex;
					flex-direction: column;
				}

				.conversation-container {
					flex: 1;
					display: flex;
					flex-direction: column;
					overflow: hidden;
				}

				.messages-area {
					flex: 1;
					overflow-y: auto;
					padding: 1rem;
					display: flex;
					flex-direction: column;
					gap: 1rem;
				}

				.message {
					max-width: 80%;
					padding: 0.75rem 1rem;
					border-radius: 1rem;
					word-wrap: break-word;
				}

				.message.user {
					align-self: flex-end;
					background-color: var(--vscode-button-background);
					color: var(--vscode-button-foreground);
				}

				.message.agent {
					align-self: flex-start;
					background-color: var(--vscode-input-background);
					border: 1px solid var(--vscode-input-border);
				}

				.message.system {
					align-self: center;
					background-color: var(--vscode-badge-background);
					color: var(--vscode-badge-foreground);
					font-size: 0.85em;
					max-width: 90%;
				}

				.input-area {
					padding: 1rem;
					border-top: 1px solid var(--vscode-panel-border);
					display: flex;
					gap: 0.5rem;
				}

				.message-input {
					flex: 1;
					padding: 0.75rem;
					border: 1px solid var(--vscode-input-border);
					border-radius: 0.25rem;
					background-color: var(--vscode-input-background);
					color: var(--vscode-input-foreground);
					font-family: inherit;
					resize: none;
				}

				.send-button {
					padding: 0.75rem 1.5rem;
					background-color: var(--vscode-button-background);
					color: var(--vscode-button-foreground);
					border: none;
					border-radius: 0.25rem;
					cursor: pointer;
					font-weight: 500;
				}

				.send-button:hover {
					background-color: var(--vscode-button-hoverBackground);
				}

				.send-button:disabled {
					opacity: 0.6;
					cursor: not-allowed;
				}

				.welcome-screen {
					text-align: center;
					padding: 2rem;
					color: var(--vscode-descriptionForeground);
				}

				.welcome-title {
					font-size: 1.5rem;
					margin-bottom: 1rem;
					color: var(--vscode-foreground);
				}

				.quick-actions {
					display: flex;
					gap: 0.5rem;
					flex-wrap: wrap;
					justify-content: center;
					margin-top: 1rem;
				}

				.quick-action {
					padding: 0.5rem 1rem;
					background-color: var(--vscode-button-secondaryBackground);
					color: var(--vscode-button-secondaryForeground);
					border: none;
					border-radius: 0.25rem;
					cursor: pointer;
					font-size: 0.9rem;
				}

				.quick-action:hover {
					background-color: var(--vscode-button-secondaryHoverBackground);
				}
			</style>
		</head>
		<body>
			<div class="conversation-container">
				<div class="messages-area" id="messagesArea">
					<div class="welcome-screen">
						<h2 class="welcome-title">Welcome to AIDE</h2>
						<p>Your AI-native development environment. Describe what you want to build and I'll help you create it.</p>						<div class="quick-actions">
							<button class="quick-action" onclick="sendQuickMessage('Create a new React app')">Create React App</button>
							<button class="quick-action" onclick="sendQuickMessage('Build a REST API')">Build REST API</button>
							<button class="quick-action" onclick="sendQuickMessage('Design a mobile app')">Design Mobile App</button>
							<button class="quick-action" onclick="testAgentRuntime()">Test Agent Runtime</button>
						</div>
					</div>
				</div>
				<div class="input-area">
					<textarea
						id="messageInput"
						class="message-input"
						placeholder="Describe what you want to build..."
						rows="3"
					></textarea>
					<button id="sendButton" class="send-button">Send</button>
				</div>
			</div>

			<script>
				const vscode = acquireVsCodeApi();
				const messagesArea = document.getElementById('messagesArea');
				const messageInput = document.getElementById('messageInput');
				const sendButton = document.getElementById('sendButton');

				let messages = [];
				let isProcessing = false;				// Handle messages from extension
				window.addEventListener('message', event => {
					const message = event.data;

					switch (message.type) {
						case 'agent_message':
							addMessage(message.data.content, 'agent', message.data.agentId);
							break;
						case 'task_started':
							addMessage(message.data.message, 'system');
							break;
						case 'state_update':
							// Update UI with current state
							break;
						case 'error':
							addMessage(message.data.message, 'system');
							break;						case 'agent_test_result':
							const result = message.data;
							if (result.success) {
								addMessage('✓ ' + result.message, 'system');
								if (result.details) {
									addMessage('Agent count: ' + result.details.agentCount, 'system');
									addMessage('Test execution: ' + (result.details.testExecution.success ? 'Success' : 'Failed') + ' (' + result.details.testExecution.duration + 'ms)', 'system');
								}
							} else {
								addMessage('✗ ' + result.message, 'system');
								if (result.details && result.details.error) {
									addMessage('Error: ' + result.details.error, 'system');
								}
							}
							break;
					}
				});

				function addMessage(content, type, sender = '') {
					const welcomeScreen = messagesArea.querySelector('.welcome-screen');
					if (welcomeScreen) {
						welcomeScreen.remove();
					}

					const messageElement = document.createElement('div');
					messageElement.className = \`message \${type}\`;

					if (sender) {
						messageElement.innerHTML = \`<strong>\${sender}:</strong> \${content}\`;
					} else {
						messageElement.textContent = content;
					}

					messagesArea.appendChild(messageElement);
					messagesArea.scrollTop = messagesArea.scrollHeight;

					messages.push({ content, type, sender, timestamp: new Date() });
				}

				function sendMessage() {
					const content = messageInput.value.trim();
					if (!content || isProcessing) return;

					addMessage(content, 'user');
					messageInput.value = '';
					isProcessing = true;
					sendButton.disabled = true;

					vscode.postMessage({
						type: 'user_message',
						data: { content }
					});

					setTimeout(() => {
						isProcessing = false;
						sendButton.disabled = false;
					}, 1000);
				}				function sendQuickMessage(content) {
					messageInput.value = content;
					sendMessage();
				}

				function testAgentRuntime() {
					addMessage('Testing agent runtime...', 'system');
					vscode.postMessage({ type: 'test_agent_runtime' });
				}

				// Event listeners
				sendButton.addEventListener('click', sendMessage);
				messageInput.addEventListener('keydown', (e) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault();
						sendMessage();
					}
				});

				// Request initial state
				vscode.postMessage({ type: 'request_state' });
			</script>
		</body>
		</html>`;
	}

	private async handleTestAgentRuntime() {
		try {
			if (!this.agentRuntime) {
				this.postMessage({
					type: 'agent_test_result',
					data: {
						success: false,
						message: 'Agent runtime not available',
						details: 'The agent runtime has not been initialized',
					},
				});
				return;
			} // Test basic agent runtime functionality
			const agentStatuses = this.agentRuntime.getAgentStatuses();
			const statusArray: any[] = [];
			for (const [id, status] of agentStatuses.entries()) {
				statusArray.push({
					id,
					isHealthy: status.isHealthy,
					isEnabled: status.isEnabled,
					lastActivity: status.lastActivity,
					tasksCompleted: status.totalTasksCompleted,
				});
			}

			// Test simple task execution
			const testTask = {
				id: 'test-' + Date.now(),
				title: 'Agent Runtime Test',
				description: 'Testing agent runtime connectivity',
				agentId: 'planner',
				status: 'pending' as const,
				priority: 'medium' as const,
				inputs: {
					test: true,
					message: 'Simple connectivity test',
				},
				createdAt: new Date(),
				progress: 0,
			};

			const result = await this.agentRuntime.executeTask(testTask);

			this.postMessage({
				type: 'agent_test_result',
				data: {
					success: true,
					message: 'Agent runtime test completed successfully',
					details: {
						agentCount: agentStatuses.size,
						agents: statusArray,
						testExecution: {
							success: result.success,
							duration: result.duration,
							hasOutputs: !!result.outputs,
						},
					},
				},
			});
		} catch (error) {
			this.postMessage({
				type: 'agent_test_result',
				data: {
					success: false,
					message: 'Agent runtime test failed',
					details: {
						error: error instanceof Error ? error.message : String(error),
						stack: error instanceof Error ? error.stack : undefined,
					},
				},
			});
		}
	}

	public dispose(): void {
		if (this.panel) {
			this.panel.dispose();
			this.panel = undefined;
		}

		this.disposables.forEach(d => d.dispose());
		this.disposables = [];
	}
}
