import * as vscode from 'vscode';
import { MemoryGraph } from '../memory/memoryGraph';
import { AgentManager } from '../agents/agentManager';

export interface ProjectStatusData {
	name: string;
	type: 'web' | 'mobile' | 'desktop' | 'api' | 'library' | 'unknown';
	status: 'planning' | 'development' | 'testing' | 'deployment' | 'completed';
	progress: number; // 0-100
	lastUpdated: Date;
	features: FeatureStatus[];
	metrics: ProjectMetrics;
}

export interface FeatureStatus {
	id: string;
	name: string;
	status: 'planned' | 'in-progress' | 'completed' | 'blocked';
	progress: number;
	agent: string;
	dependencies: string[];
}

export interface ProjectMetrics {
	filesCreated: number;
	linesOfCode: number;
	testsWritten: number;
	bugsFixed: number;
	deploymentsCount: number;
}

/**
 * Project Status Dashboard for AIDE
 * Provides an overview of current project status and progress
 */
export class ProjectStatus {
	private panel: vscode.WebviewPanel | undefined;
	private memoryGraph: MemoryGraph;
	private agentManager: AgentManager;
	private statusData: ProjectStatusData;

	constructor(memoryGraph: MemoryGraph, agentManager: AgentManager) {
		this.memoryGraph = memoryGraph;
		this.agentManager = agentManager;
		this.statusData = this.initializeStatusData();
	}

	/**
	 * Shows the project status dashboard
	 */
	public show(context: vscode.ExtensionContext): void {
		const columnToShowIn = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (this.panel) {
			this.panel.reveal(columnToShowIn);
			this.refreshStatus();
			return;
		}

		this.panel = vscode.window.createWebviewPanel(
			'aideProjectStatus',
			'AIDE - Project Status',
			vscode.ViewColumn.Two,
			{
				enableScripts: true,
				retainContextWhenHidden: true
			}
		);

		this.panel.webview.html = this.getWebviewContent();
		this.setupMessageHandlers();
		this.refreshStatus();

		this.panel.onDidDispose(() => {
			this.panel = undefined;
		}, null, context.subscriptions);
	}

	/**
	 * Updates project status data
	 */
	public updateStatus(updates: Partial<ProjectStatusData>): void {
		this.statusData = { ...this.statusData, ...updates };
		this.statusData.lastUpdated = new Date();
		this.refreshStatus();
	}

	/**
	 * Adds or updates a feature status
	 */
	public updateFeature(feature: FeatureStatus): void {
		const existingIndex = this.statusData.features.findIndex(f => f.id === feature.id);
		if (existingIndex >= 0) {
			this.statusData.features[existingIndex] = feature;
		} else {
			this.statusData.features.push(feature);
		}
		this.updateOverallProgress();
		this.refreshStatus();
	}

	/**
	 * Updates project metrics
	 */
	public updateMetrics(metrics: Partial<ProjectMetrics>): void {
		this.statusData.metrics = { ...this.statusData.metrics, ...metrics };
		this.refreshStatus();
	}

	/**
	 * Refreshes the status dashboard with current data
	 */
	private refreshStatus(): void {
		if (!this.panel) return;

		this.analyzeMemoryGraph();
		this.panel.webview.postMessage({
			type: 'updateStatus',
			data: this.statusData
		});
	}

	/**
	 * Shows a live preview of the current project
	 */
	public async showLivePreview(): Promise<void> {
		// Determine the project type and appropriate preview URL
		const projectType = this.statusData.type;
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

		if (!workspaceFolder) {
			vscode.window.showErrorMessage('No workspace folder found for preview.');
			return;
		}

		let previewUrl = '';
		let startCommand = '';

		switch (projectType) {
			case 'web':
				// Check for common dev server configurations
				const packageJsonPath = vscode.Uri.joinPath(workspaceFolder.uri, 'package.json');
				try {
					const packageJson = await vscode.workspace.fs.readFile(packageJsonPath);
					const packageData = JSON.parse(packageJson.toString());

					if (packageData.scripts?.dev) {
						startCommand = 'npm run dev';
						previewUrl = 'http://localhost:3000';
					} else if (packageData.scripts?.start) {
						startCommand = 'npm start';
						previewUrl = 'http://localhost:3000';
					}
				} catch (error) {
					// Fallback for static files
					previewUrl = vscode.Uri.joinPath(workspaceFolder.uri, 'index.html').toString();
				}
				break;

			case 'api':
				startCommand = 'npm start';
				previewUrl = 'http://localhost:8000';
				break;

			default:
				vscode.window.showInformationMessage('Live preview not supported for this project type yet.');
				return;
		}

		if (startCommand) {
			// Start the development server
			const terminal = vscode.window.createTerminal({
				name: 'AIDE Live Preview',
				cwd: workspaceFolder.uri.fsPath
			});
			terminal.sendText(startCommand);
			terminal.show();

			// Wait a moment for server to start, then open preview
			setTimeout(() => {
				vscode.env.openExternal(vscode.Uri.parse(previewUrl));
			}, 3000);
		} else if (previewUrl) {
			// Open static preview
			vscode.env.openExternal(vscode.Uri.parse(previewUrl));
		}

		// Update project status
		this.updateStatus({
			lastUpdated: new Date()
		});

		vscode.window.showInformationMessage('Live preview started! Check your browser.');
	}

	/**
	 * Sets up message handlers for webview communication
	 */
	private setupMessageHandlers(): void {
		this.panel!.webview.onDidReceiveMessage(async (message) => {
			switch (message.type) {
				case 'refreshStatus':
					this.refreshStatus();
					break;
				case 'createFeature':
					await this.createNewFeature(message.featureName);
					break;
				case 'updateFeatureStatus':
					await this.updateFeatureStatus(message.featureId, message.status);
					break;
				case 'exportStatus':
					await this.exportProjectStatus();
					break;
				case 'showFeatureDetails':
					await this.showFeatureDetails(message.featureId);
					break;
			}
		});
	}

	/**
	 * Analyzes memory graph to update project status
	 */
	private analyzeMemoryGraph(): void {
		const graphData = this.memoryGraph.getGraphData();
		const nodes = graphData.nodes;

		// Count different types of activities
		let filesCreated = 0;
		let testsWritten = 0;
		let deploymentsCount = 0;

		for (const node of nodes) {
			if (node.metadata.action === 'createFile') {
				filesCreated++;
			} else if (node.metadata.action === 'createTest') {
				testsWritten++;
			} else if (node.metadata.action === 'deploy') {
				deploymentsCount++;
			}
		}

		// Update metrics
		this.statusData.metrics = {
			...this.statusData.metrics,
			filesCreated,
			testsWritten,
			deploymentsCount
		};

		// Analyze project type from nodes
		const featureNodes = nodes.filter(node => node.type === 'feature');
		if (featureNodes.length > 0) {
			this.updateFeaturesFromMemory(featureNodes);
		}

		// Determine project type from patterns
		this.inferProjectType(nodes);
	}

	/**
	 * Updates features based on memory graph nodes
	 */
	private updateFeaturesFromMemory(featureNodes: any[]): void {
		for (const node of featureNodes) {
			const existingFeature = this.statusData.features.find(f => f.id === node.id);
			if (!existingFeature) {
				this.statusData.features.push({
					id: node.id,
					name: node.content,
					status: 'planned',
					progress: 0,
					agent: node.metadata.agent || 'unknown',
					dependencies: []
				});
			}
		}
	}

	/**
	 * Infers project type from memory patterns
	 */
	private inferProjectType(nodes: any[]): void {
		const technologies = nodes
			.map(node => node.content.toLowerCase())
			.join(' ');

		if (technologies.includes('react') || technologies.includes('vue') || technologies.includes('angular')) {
			this.statusData.type = 'web';
		} else if (technologies.includes('react native') || technologies.includes('flutter') || technologies.includes('mobile')) {
			this.statusData.type = 'mobile';
		} else if (technologies.includes('electron') || technologies.includes('desktop')) {
			this.statusData.type = 'desktop';
		} else if (technologies.includes('api') || technologies.includes('server') || technologies.includes('backend')) {
			this.statusData.type = 'api';
		} else if (technologies.includes('library') || technologies.includes('package')) {
			this.statusData.type = 'library';
		}
	}

	/**
	 * Creates a new feature
	 */
	private async createNewFeature(featureName: string): Promise<void> {
		const feature: FeatureStatus = {
			id: `feature-${Date.now()}`,
			name: featureName,
			status: 'planned',
			progress: 0,
			agent: 'planner',
			dependencies: []
		};

		this.updateFeature(feature);

		// Add to memory graph
		this.memoryGraph.addNode('feature', featureName, {
			agent: 'planner',
			status: 'planned',
			createdAt: new Date().toISOString()
		});

		vscode.window.showInformationMessage(`Feature "${featureName}" added to project.`);
	}

	/**
	 * Updates feature status
	 */
	private async updateFeatureStatus(featureId: string, status: string): Promise<void> {
		const feature = this.statusData.features.find(f => f.id === featureId);
		if (!feature) return;

		feature.status = status as any;

		// Update progress based on status
		switch (status) {
			case 'planned':
				feature.progress = 0;
				break;
			case 'in-progress':
				feature.progress = 50;
				break;
			case 'completed':
				feature.progress = 100;
				break;
			case 'blocked':
				// Keep current progress
				break;
		}

		this.updateOverallProgress();
		this.refreshStatus();

		// Update in memory graph
		this.memoryGraph.updateNode(featureId, {
			metadata: { status: status, lastUpdated: new Date().toISOString() }
		});
	}

	/**
	 * Shows detailed information about a feature
	 */
	private async showFeatureDetails(featureId: string): Promise<void> {
		const feature = this.statusData.features.find(f => f.id === featureId);
		if (!feature) return;

		const connectedNodes = this.memoryGraph.getConnectedNodes(featureId);

		this.panel!.webview.postMessage({
			type: 'showFeatureDetails',
			feature: feature,
			relatedNodes: connectedNodes
		});
	}

	/**
	 * Exports project status report
	 */
	private async exportProjectStatus(): Promise<void> {
		const report = {
			projectName: this.statusData.name,
			type: this.statusData.type,
			status: this.statusData.status,
			progress: this.statusData.progress,
			lastUpdated: this.statusData.lastUpdated,
			features: this.statusData.features,
			metrics: this.statusData.metrics,
			exportedAt: new Date().toISOString()
		};

		const exportData = JSON.stringify(report, null, 2);

		const uri = await vscode.window.showSaveDialog({
			defaultUri: vscode.Uri.file(`${this.statusData.name}-status-report.json`),
			filters: {
				'JSON Files': ['json']
			}
		});

		if (uri) {
			await vscode.workspace.fs.writeFile(uri, Buffer.from(exportData));
			vscode.window.showInformationMessage('Project status report exported successfully.');
		}
	}

	/**
	 * Calculates overall project progress
	 */
	private updateOverallProgress(): void {
		if (this.statusData.features.length === 0) {
			this.statusData.progress = 0;
			return;
		}

		const totalProgress = this.statusData.features.reduce((sum, feature) => sum + feature.progress, 0);
		this.statusData.progress = Math.round(totalProgress / this.statusData.features.length);

		// Update overall status based on progress
		if (this.statusData.progress === 0) {
			this.statusData.status = 'planning';
		} else if (this.statusData.progress === 100) {
			this.statusData.status = 'completed';
		} else if (this.statusData.progress > 80) {
			this.statusData.status = 'testing';
		} else {
			this.statusData.status = 'development';
		}
	}

	/**
	 * Initializes default status data
	 */
	private initializeStatusData(): ProjectStatusData {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		const projectName = workspaceFolder ? workspaceFolder.name : 'AIDE Project';

		return {
			name: projectName,
			type: 'unknown',
			status: 'planning',
			progress: 0,
			lastUpdated: new Date(),
			features: [],
			metrics: {
				filesCreated: 0,
				linesOfCode: 0,
				testsWritten: 0,
				bugsFixed: 0,
				deploymentsCount: 0
			}
		};
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
	<title>AIDE - Project Status</title>
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
			padding: 20px;
			line-height: 1.6;
		}

		.header {
			margin-bottom: 30px;
		}

		.header h1 {
			font-size: 28px;
			font-weight: 300;
			margin-bottom: 8px;
		}

		.header .subtitle {
			opacity: 0.8;
			font-size: 14px;
		}

		.status-grid {
			display: grid;
			grid-template-columns: 2fr 1fr;
			gap: 20px;
			margin-bottom: 30px;
		}

		.card {
			background: var(--vscode-editor-selectionBackground);
			border-radius: 8px;
			padding: 20px;
			border: 1px solid var(--vscode-panel-border);
		}

		.card h2 {
			font-size: 18px;
			margin-bottom: 16px;
			font-weight: 600;
		}

		.project-overview {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 16px;
		}

		.overview-item {
			display: flex;
			flex-direction: column;
		}

		.overview-label {
			font-size: 12px;
			text-transform: uppercase;
			opacity: 0.8;
			margin-bottom: 4px;
		}

		.overview-value {
			font-size: 18px;
			font-weight: 600;
		}

		.status-badge {
			display: inline-block;
			padding: 4px 8px;
			border-radius: 4px;
			font-size: 12px;
			font-weight: 600;
			text-transform: uppercase;
		}

		.status-planning { background: #FFC107; color: #000; }
		.status-development { background: #007ACC; color: #fff; }
		.status-testing { background: #FD7E14; color: #fff; }
		.status-deployment { background: #6F42C1; color: #fff; }
		.status-completed { background: #28A745; color: #fff; }

		.type-badge {
			display: inline-block;
			padding: 4px 8px;
			border-radius: 4px;
			font-size: 12px;
			background: var(--vscode-badge-background);
			color: var(--vscode-badge-foreground);
		}

		.progress-bar {
			width: 100%;
			height: 8px;
			background: var(--vscode-input-background);
			border-radius: 4px;
			overflow: hidden;
			margin: 8px 0;
		}

		.progress-fill {
			height: 100%;
			background: linear-gradient(90deg, #007ACC, #28A745);
			border-radius: 4px;
			transition: width 0.3s ease;
		}

		.metrics-grid {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 12px;
		}

		.metric-item {
			text-align: center;
			padding: 12px;
			background: var(--vscode-input-background);
			border-radius: 4px;
		}

		.metric-value {
			font-size: 24px;
			font-weight: 600;
			color: var(--vscode-charts-blue);
			display: block;
		}

		.metric-label {
			font-size: 12px;
			opacity: 0.8;
		}

		.features-section {
			margin-top: 30px;
		}

		.features-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 16px;
		}

		.btn {
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			padding: 8px 16px;
			border-radius: 4px;
			cursor: pointer;
			font-size: 13px;
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

		.features-list {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}

		.feature-item {
			background: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border);
			border-radius: 6px;
			padding: 16px;
			cursor: pointer;
		}

		.feature-item:hover {
			border-color: var(--vscode-focusBorder);
		}

		.feature-header {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			margin-bottom: 8px;
		}

		.feature-name {
			font-weight: 600;
			margin-bottom: 4px;
		}

		.feature-agent {
			font-size: 12px;
			opacity: 0.8;
		}

		.feature-status {
			font-size: 11px;
			padding: 2px 6px;
			border-radius: 3px;
			font-weight: 600;
			text-transform: uppercase;
		}

		.feature-planned { background: #6C757D; color: #fff; }
		.feature-in-progress { background: #007ACC; color: #fff; }
		.feature-completed { background: #28A745; color: #fff; }
		.feature-blocked { background: #DC3545; color: #fff; }

		.feature-progress {
			margin-top: 8px;
		}

		.empty-state {
			text-align: center;
			padding: 40px 20px;
			opacity: 0.6;
		}

		.empty-state h3 {
			margin-bottom: 8px;
			font-weight: 300;
		}

		.actions {
			display: flex;
			gap: 8px;
			margin-top: 20px;
		}

		.modal {
			display: none;
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.5);
			z-index: 1000;
		}

		.modal-content {
			background: var(--vscode-editor-background);
			border: 1px solid var(--vscode-panel-border);
			border-radius: 8px;
			padding: 20px;
			max-width: 500px;
			margin: 50px auto;
		}

		.modal-header {
			margin-bottom: 16px;
		}

		.modal-header h3 {
			margin-bottom: 4px;
		}

		.form-group {
			margin-bottom: 16px;
		}

		.form-label {
			display: block;
			margin-bottom: 4px;
			font-size: 13px;
			font-weight: 600;
		}

		.form-input {
			width: 100%;
			background: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border);
			border-radius: 4px;
			padding: 8px;
			font-size: 14px;
		}

		.form-input:focus {
			outline: none;
			border-color: var(--vscode-focusBorder);
		}

		.modal-actions {
			display: flex;
			gap: 8px;
			justify-content: flex-end;
		}
	</style>
</head>
<body>
	<div class="header">
		<h1 id="project-name">AIDE Project</h1>
		<div class="subtitle">Last updated: <span id="last-updated">Never</span></div>
	</div>

	<div class="status-grid">
		<div class="card">
			<h2>Project Overview</h2>
			<div class="project-overview">
				<div class="overview-item">
					<div class="overview-label">Status</div>
					<div class="overview-value">
						<span class="status-badge" id="project-status">Planning</span>
					</div>
				</div>
				<div class="overview-item">
					<div class="overview-label">Type</div>
					<div class="overview-value">
						<span class="type-badge" id="project-type">Unknown</span>
					</div>
				</div>
				<div class="overview-item">
					<div class="overview-label">Progress</div>
					<div class="overview-value" id="project-progress">0%</div>
				</div>
				<div class="overview-item">
					<div class="overview-label">Features</div>
					<div class="overview-value" id="features-count">0</div>
				</div>
			</div>
			<div class="progress-bar">
				<div class="progress-fill" id="progress-fill" style="width: 0%"></div>
			</div>
		</div>

		<div class="card">
			<h2>Metrics</h2>
			<div class="metrics-grid">
				<div class="metric-item">
					<span class="metric-value" id="files-created">0</span>
					<div class="metric-label">Files Created</div>
				</div>
				<div class="metric-item">
					<span class="metric-value" id="tests-written">0</span>
					<div class="metric-label">Tests Written</div>
				</div>
				<div class="metric-item">
					<span class="metric-value" id="lines-of-code">0</span>
					<div class="metric-label">Lines of Code</div>
				</div>
				<div class="metric-item">
					<span class="metric-value" id="deployments">0</span>
					<div class="metric-label">Deployments</div>
				</div>
			</div>
		</div>
	</div>

	<div class="features-section">
		<div class="card">
			<div class="features-header">
				<h2>Features</h2>
				<button class="btn" onclick="showCreateFeatureModal()">Add Feature</button>
			</div>

			<div id="features-list" class="features-list">
				<div class="empty-state">
					<h3>No features yet</h3>
					<p>Add features to track project progress</p>
				</div>
			</div>
		</div>
	</div>

	<div class="actions">
		<button class="btn btn-secondary" onclick="refreshStatus()">Refresh</button>
		<button class="btn btn-secondary" onclick="exportStatus()">Export Report</button>
	</div>

	<!-- Create Feature Modal -->
	<div id="create-feature-modal" class="modal">
		<div class="modal-content">
			<div class="modal-header">
				<h3>Create New Feature</h3>
			</div>
			<div class="form-group">
				<label class="form-label" for="feature-name">Feature Name</label>
				<input type="text" id="feature-name" class="form-input" placeholder="Enter feature name...">
			</div>
			<div class="modal-actions">
				<button class="btn btn-secondary" onclick="hideCreateFeatureModal()">Cancel</button>
				<button class="btn" onclick="createFeature()">Create</button>
			</div>
		</div>
	</div>

	<script>
		const vscode = acquireVsCodeApi();
		let currentStatus = null;

		// Handle messages from extension
		window.addEventListener('message', event => {
			const message = event.data;

			switch (message.type) {
				case 'updateStatus':
					updateStatusDisplay(message.data);
					break;
				case 'showFeatureDetails':
					showFeatureDetails(message.feature, message.relatedNodes);
					break;
			}
		});

		// Update status display
		function updateStatusDisplay(status) {
			currentStatus = status;

			// Update project info
			document.getElementById('project-name').textContent = status.name;
			document.getElementById('last-updated').textContent = new Date(status.lastUpdated).toLocaleString();

			// Update status badge
			const statusElement = document.getElementById('project-status');
			statusElement.textContent = status.status;
			statusElement.className = \`status-badge status-\${status.status}\`;

			// Update type badge
			document.getElementById('project-type').textContent = status.type;

			// Update progress
			document.getElementById('project-progress').textContent = \`\${status.progress}%\`;
			document.getElementById('progress-fill').style.width = \`\${status.progress}%\`;

			// Update features count
			document.getElementById('features-count').textContent = status.features.length;

			// Update metrics
			document.getElementById('files-created').textContent = status.metrics.filesCreated;
			document.getElementById('tests-written').textContent = status.metrics.testsWritten;
			document.getElementById('lines-of-code').textContent = status.metrics.linesOfCode;
			document.getElementById('deployments').textContent = status.metrics.deploymentsCount;

			// Update features list
			updateFeaturesList(status.features);
		}

		// Update features list
		function updateFeaturesList(features) {
			const listElement = document.getElementById('features-list');

			if (features.length === 0) {
				listElement.innerHTML = \`
					<div class="empty-state">
						<h3>No features yet</h3>
						<p>Add features to track project progress</p>
					</div>
				\`;
				return;
			}

			listElement.innerHTML = features.map(feature => \`
				<div class="feature-item" onclick="showFeatureDetails('\${feature.id}')">
					<div class="feature-header">
						<div>
							<div class="feature-name">\${feature.name}</div>
							<div class="feature-agent">By \${feature.agent}</div>
						</div>
						<div class="feature-status feature-\${feature.status}">\${feature.status}</div>
					</div>
					<div class="feature-progress">
						<div class="progress-bar">
							<div class="progress-fill" style="width: \${feature.progress}%"></div>
						</div>
					</div>
				</div>
			\`).join('');
		}

		// Show create feature modal
		function showCreateFeatureModal() {
			document.getElementById('create-feature-modal').style.display = 'block';
			document.getElementById('feature-name').focus();
		}

		// Hide create feature modal
		function hideCreateFeatureModal() {
			document.getElementById('create-feature-modal').style.display = 'none';
			document.getElementById('feature-name').value = '';
		}

		// Create new feature
		function createFeature() {
			const featureName = document.getElementById('feature-name').value.trim();
			if (!featureName) return;

			vscode.postMessage({
				type: 'createFeature',
				featureName: featureName
			});

			hideCreateFeatureModal();
		}

		// Show feature details
		function showFeatureDetails(featureId) {
			vscode.postMessage({
				type: 'showFeatureDetails',
				featureId: featureId
			});
		}

		// Refresh status
		function refreshStatus() {
			vscode.postMessage({ type: 'refreshStatus' });
		}

		// Export status
		function exportStatus() {
			vscode.postMessage({ type: 'exportStatus' });
		}

		// Handle Enter key in feature name input
		document.getElementById('feature-name').addEventListener('keydown', function(e) {
			if (e.key === 'Enter') {
				createFeature();
			}
		});

		// Close modal when clicking outside
		document.getElementById('create-feature-modal').addEventListener('click', function(e) {
			if (e.target === this) {
				hideCreateFeatureModal();
			}
		});

		// Request initial status
		vscode.postMessage({ type: 'refreshStatus' });
	</script>
</body>
</html>`;
	}
}
