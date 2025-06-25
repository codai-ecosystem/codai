import * as vscode from 'vscode';

/**
 * TimelinePanel - Shows project development timeline and history
 * Tracks changes, decisions, and progress over time
 */
export class TimelinePanel {
	private panel: vscode.WebviewPanel | undefined;
	private disposables: vscode.Disposable[] = [];
	private timeline: TimelineEvent[] = [];

	constructor(private context: vscode.ExtensionContext) {
		// Initialize with a welcome event
		this.timeline = [
			{
				id: Date.now().toString(),
				timestamp: new Date(),
				type: 'system',
				title: 'AIDE Session Started',
				description: 'Welcome to AIDE! Your development journey begins here.',
				icon: '🚀',
				data: {},
			},
		];
	}

	public show(): void {
		if (this.panel) {
			this.panel.reveal();
			return;
		}

		this.panel = vscode.window.createWebviewPanel(
			'aide.timeline',
			'AIDE Timeline',
			vscode.ViewColumn.Two,
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

		// Handle messages from the webview
		this.panel.webview.onDidReceiveMessage(
			message => {
				switch (message.type) {
					case 'get_timeline':
						this.sendTimeline();
						break;
					case 'clear_timeline':
						this.clearTimeline();
						break;
					case 'export_timeline':
						this.exportTimeline();
						break;
					case 'filter_timeline':
						this.filterTimeline(message.filter);
						break;
				}
			},
			undefined,
			this.disposables
		);

		// Clean up when the panel is closed
		this.panel.onDidDispose(
			() => {
				this.panel = undefined;
				this.disposables.forEach(d => d.dispose());
				this.disposables = [];
			},
			null,
			this.disposables
		);

		// Send initial timeline data
		setTimeout(() => this.sendTimeline(), 100);
	}

	public hide(): void {
		if (this.panel) {
			this.panel.dispose();
		}
	}

	public addEvent(event: Omit<TimelineEvent, 'id' | 'timestamp'>): void {
		const timelineEvent: TimelineEvent = {
			...event,
			id: Date.now().toString(),
			timestamp: new Date(),
		};

		this.timeline.unshift(timelineEvent); // Add to beginning for chronological order
		this.sendTimeline();
	}

	public addUserMessage(message: string): void {
		this.addEvent({
			type: 'user_input',
			title: 'User Request',
			description: message,
			icon: '💬',
			data: { message },
		});
	}

	public addAgentResponse(agent: string, response: string): void {
		this.addEvent({
			type: 'agent_response',
			title: `${agent} Response`,
			description: response,
			icon: '🤖',
			data: { agent, response },
		});
	}

	public addFileChange(action: 'created' | 'modified' | 'deleted', filePath: string): void {
		const icons = { created: '📄', modified: '✏️', deleted: '🗑️' };
		this.addEvent({
			type: 'file_change',
			title: `File ${action}`,
			description: filePath,
			icon: icons[action],
			data: { action, filePath },
		});
	}

	public addBuildEvent(success: boolean, details: string): void {
		this.addEvent({
			type: 'build',
			title: success ? 'Build Successful' : 'Build Failed',
			description: details,
			icon: success ? '✅' : '❌',
			data: { success, details },
		});
	}

	public addMemoryGraphUpdate(nodeType: string, action: string): void {
		this.addEvent({
			type: 'memory_graph',
			title: 'Memory Graph Updated',
			description: `${action} ${nodeType} node`,
			icon: '🧠',
			data: { nodeType, action },
		});
	}

	private sendTimeline(): void {
		this.postMessage({
			type: 'timeline_data',
			data: this.timeline,
		});
	}

	private clearTimeline(): void {
		this.timeline = [
			{
				id: Date.now().toString(),
				timestamp: new Date(),
				type: 'system',
				title: 'Timeline Cleared',
				description: 'Timeline has been reset.',
				icon: '🔄',
				data: {},
			},
		];
		this.sendTimeline();
	}

	private async exportTimeline(): Promise<void> {
		try {
			const timelineData = JSON.stringify(this.timeline, null, 2);
			const document = await vscode.workspace.openTextDocument({
				content: timelineData,
				language: 'json',
			});
			await vscode.window.showTextDocument(document);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to export timeline: ${error}`);
		}
	}

	private filterTimeline(filter: string): void {
		let filteredTimeline = this.timeline;

		if (filter && filter !== 'all') {
			filteredTimeline = this.timeline.filter(event => event.type === filter);
		}

		this.postMessage({
			type: 'filtered_timeline_data',
			data: filteredTimeline,
		});
	}

	private postMessage(message: any) {
		if (this.panel) {
			this.panel.webview.postMessage(message);
		}
	}

	private getWebviewContent(): string {
		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>AIDE Timeline</title>
			<style>
				* {
					margin: 0;
					padding: 0;
					box-sizing: border-box;
				}

				body {
					font-family: var(--vscode-font-family);
					background: var(--vscode-editor-background);
					color: var(--vscode-editor-foreground);
					height: 100vh;
					display: flex;
					flex-direction: column;
				}

				.header {
					padding: 12px 16px;
					background: var(--vscode-panel-background);
					border-bottom: 1px solid var(--vscode-panel-border);
					display: flex;
					align-items: center;
					gap: 12px;
				}

				.header h2 {
					flex: 1;
					font-size: 16px;
					font-weight: 600;
				}

				.controls {
					display: flex;
					gap: 8px;
					align-items: center;
				}

				.filter-select {
					background: var(--vscode-dropdown-background);
					border: 1px solid var(--vscode-dropdown-border);
					border-radius: 4px;
					padding: 4px 8px;
					color: var(--vscode-dropdown-foreground);
					font-size: 12px;
					min-width: 100px;
				}

				.button {
					background: var(--vscode-button-background);
					color: var(--vscode-button-foreground);
					border: none;
					border-radius: 4px;
					padding: 4px 8px;
					cursor: pointer;
					font-size: 12px;
				}

				.button:hover {
					background: var(--vscode-button-hoverBackground);
				}

				.button.secondary {
					background: var(--vscode-button-secondaryBackground);
					color: var(--vscode-button-secondaryForeground);
				}

				.button.secondary:hover {
					background: var(--vscode-button-secondaryHoverBackground);
				}

				.timeline-container {
					flex: 1;
					overflow-y: auto;
					padding: 16px;
				}

				.timeline {
					position: relative;
					max-width: 800px;
					margin: 0 auto;
				}

				.timeline::before {
					content: '';
					position: absolute;
					left: 30px;
					top: 0;
					bottom: 0;
					width: 2px;
					background: var(--vscode-panel-border);
				}

				.timeline-event {
					position: relative;
					margin-bottom: 24px;
					padding-left: 70px;
					animation: fadeInUp 0.3s ease-out;
				}

				@keyframes fadeInUp {
					from {
						opacity: 0;
						transform: translateY(20px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				.timeline-event::before {
					content: attr(data-icon);
					position: absolute;
					left: 19px;
					top: 0;
					width: 24px;
					height: 24px;
					background: var(--vscode-editor-background);
					border: 2px solid var(--vscode-button-background);
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 12px;
					z-index: 1;
				}

				.timeline-event.user_input::before {
					border-color: #007ACC;
					background: #007ACC;
				}

				.timeline-event.agent_response::before {
					border-color: #28A745;
					background: #28A745;
				}

				.timeline-event.file_change::before {
					border-color: #FFC107;
					background: #FFC107;
				}

				.timeline-event.build::before {
					border-color: #DC3545;
					background: #DC3545;
				}

				.timeline-event.memory_graph::before {
					border-color: #6F42C1;
					background: #6F42C1;
				}

				.timeline-event.system::before {
					border-color: #6C757D;
					background: #6C757D;
				}

				.event-card {
					background: var(--vscode-panel-background);
					border: 1px solid var(--vscode-panel-border);
					border-radius: 8px;
					padding: 12px 16px;
					margin-left: 8px;
				}

				.event-header {
					display: flex;
					align-items: center;
					gap: 8px;
					margin-bottom: 8px;
				}

				.event-title {
					font-weight: 600;
					font-size: 14px;
					flex: 1;
				}

				.event-time {
					font-size: 11px;
					color: var(--vscode-descriptionForeground);
				}

				.event-description {
					font-size: 13px;
					line-height: 1.4;
					color: var(--vscode-editor-foreground);
					word-wrap: break-word;
				}

				.event-metadata {
					margin-top: 8px;
					padding-top: 8px;
					border-top: 1px solid var(--vscode-panel-border);
					font-size: 11px;
					color: var(--vscode-descriptionForeground);
				}

				.empty-state {
					text-align: center;
					padding: 60px 20px;
					color: var(--vscode-descriptionForeground);
				}

				.empty-state h3 {
					margin-bottom: 12px;
					color: var(--vscode-editor-foreground);
				}

				.stats-bar {
					background: var(--vscode-statusBar-background);
					color: var(--vscode-statusBar-foreground);
					padding: 8px 16px;
					font-size: 12px;
					border-top: 1px solid var(--vscode-panel-border);
					display: flex;
					justify-content: space-between;
				}

				.type-badge {
					display: inline-block;
					background: var(--vscode-badge-background);
					color: var(--vscode-badge-foreground);
					padding: 2px 6px;
					border-radius: 4px;
					font-size: 10px;
					text-transform: uppercase;
					margin-left: 8px;
				}
			</style>
		</head>
		<body>
			<div class="header">
				<h2>⏱️ Development Timeline</h2>
				<div class="controls">
					<select class="filter-select" id="filterSelect" onchange="filterTimeline()">
						<option value="all">All Events</option>
						<option value="user_input">User Input</option>
						<option value="agent_response">Agent Responses</option>
						<option value="file_change">File Changes</option>
						<option value="build">Build Events</option>
						<option value="memory_graph">Memory Graph</option>
						<option value="system">System Events</option>
					</select>
					<button class="button secondary" onclick="exportTimeline()">📁 Export</button>
					<button class="button secondary" onclick="clearTimeline()">🗑️ Clear</button>
				</div>
			</div>

			<div class="timeline-container">
				<div class="timeline" id="timeline">
					<div class="empty-state" id="emptyState">
						<h3>No events yet</h3>
						<p>Your development timeline will appear here as you work with AIDE.</p>
					</div>
				</div>
			</div>

			<div class="stats-bar">
				<span id="statsText">Loading timeline...</span>
				<span id="eventCount">0 events</span>
			</div>

			<script>
				const vscode = acquireVsCodeApi();
				let allEvents = [];
				let filteredEvents = [];

				// Handle messages from the extension
				window.addEventListener('message', event => {
					const message = event.data;

					switch (message.type) {
						case 'timeline_data':
							allEvents = message.data;
							filteredEvents = allEvents;
							renderTimeline(filteredEvents);
							updateStats();
							break;
						case 'filtered_timeline_data':
							filteredEvents = message.data;
							renderTimeline(filteredEvents);
							updateStats();
							break;
					}
				});

				function renderTimeline(events) {
					const timeline = document.getElementById('timeline');
					const emptyState = document.getElementById('emptyState');

					if (events.length === 0) {
						timeline.innerHTML = '';
						timeline.appendChild(emptyState);
						return;
					}

					emptyState.remove();

					timeline.innerHTML = events.map(event => {
						const eventTime = new Date(event.timestamp);
						const timeStr = eventTime.toLocaleTimeString() + ' - ' + eventTime.toLocaleDateString();

						return \`
							<div class="timeline-event \${event.type}" data-icon="\${event.icon}">
								<div class="event-card">
									<div class="event-header">
										<div class="event-title">\${event.title}</div>
										<span class="type-badge">\${event.type.replace('_', ' ')}</span>
										<div class="event-time">\${timeStr}</div>
									</div>
									<div class="event-description">\${event.description}</div>
									\${Object.keys(event.data).length > 0 ? \`
										<div class="event-metadata">
											\${Object.entries(event.data).map(([key, value]) =>
												\`<strong>\${key}:</strong> \${typeof value === 'string' ? value : JSON.stringify(value)}\`
											).join(' • ')}
										</div>
									\` : ''}
								</div>
							</div>
						\`;
					}).join('');
				}

				function updateStats() {
					const eventCount = document.getElementById('eventCount');
					const statsText = document.getElementById('statsText');

					eventCount.textContent = \`\${filteredEvents.length} events\`;

					if (filteredEvents.length > 0) {
						const types = [...new Set(filteredEvents.map(e => e.type))];
						statsText.textContent = \`Types: \${types.join(', ')}\`;
					} else {
						statsText.textContent = 'No events to display';
					}
				}

				function filterTimeline() {
					const filter = document.getElementById('filterSelect').value;
					vscode.postMessage({
						type: 'filter_timeline',
						filter: filter
					});
				}

				function clearTimeline() {
					if (confirm('Are you sure you want to clear the timeline? This action cannot be undone.')) {
						vscode.postMessage({
							type: 'clear_timeline'
						});
					}
				}

				function exportTimeline() {
					vscode.postMessage({
						type: 'export_timeline'
					});
				}

				// Request initial timeline data
				vscode.postMessage({
					type: 'get_timeline'
				});
			</script>
		</body>
		</html>`;
	}
}

interface TimelineEvent {
	id: string;
	timestamp: Date;
	type: 'user_input' | 'agent_response' | 'file_change' | 'build' | 'memory_graph' | 'system';
	title: string;
	description: string;
	icon: string;
	data: Record<string, any>;
}
