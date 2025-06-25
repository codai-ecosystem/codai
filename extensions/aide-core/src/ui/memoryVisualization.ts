import * as vscode from 'vscode';
import { MemoryGraph, MemoryNode, MemoryEdge } from '../memory/memoryGraph';

/**
 * Memory Visualization for AIDE
 * Provides a visual representation of the memory graph
 */
export class MemoryVisualization {
	private panel: vscode.WebviewPanel | undefined;
	private memoryGraph: MemoryGraph;

	constructor(memoryGraph: MemoryGraph) {
		this.memoryGraph = memoryGraph;
	}

	/**
	 * Shows the memory visualization in a webview
	 */
	public show(context: vscode.ExtensionContext): void {
		const columnToShowIn = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (this.panel) {
			this.panel.reveal(columnToShowIn);
			this.refreshVisualization();
			return;
		}

		this.panel = vscode.window.createWebviewPanel(
			'aideMemoryGraph',
			'AIDE - Memory Graph',
			vscode.ViewColumn.Two,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
			}
		);

		this.panel.webview.html = this.getWebviewContent();
		this.setupMessageHandlers();
		this.refreshVisualization();

		this.panel.onDidDispose(
			() => {
				this.panel = undefined;
			},
			null,
			context.subscriptions
		);
	}

	/**
	 * Refreshes the visualization with current memory graph data
	 */
	public refreshVisualization(): void {
		if (!this.panel) return;

		const graphData = this.memoryGraph.getGraphData();
		this.panel.webview.postMessage({
			type: 'updateGraph',
			nodes: graphData.nodes,
			edges: graphData.edges,
		});
	}

	/**
	 * Sets up message handlers for webview communication
	 */
	private setupMessageHandlers(): void {
		this.panel!.webview.onDidReceiveMessage(async message => {
			switch (message.type) {
				case 'nodeSelected':
					await this.handleNodeSelection(message.nodeId);
					break;
				case 'refreshGraph':
					this.refreshVisualization();
					break;
				case 'clearGraph':
					await this.clearMemoryGraph();
					break;
				case 'exportGraph':
					await this.exportMemoryGraph();
					break;
			}
		});
	}

	/**
	 * Handles node selection in the visualization
	 */
	private async handleNodeSelection(nodeId: string): Promise<void> {
		const node = this.memoryGraph.getNode(nodeId);
		if (!node) return;

		const connectedNodes = this.memoryGraph.getConnectedNodes(nodeId);

		this.panel!.webview.postMessage({
			type: 'nodeDetails',
			node: node,
			connectedNodes: connectedNodes,
		});
	}

	/**
	 * Clears the memory graph
	 */
	private async clearMemoryGraph(): Promise<void> {
		const response = await vscode.window.showWarningMessage(
			'Are you sure you want to clear all memory? This action cannot be undone.',
			'Clear',
			'Cancel'
		);

		if (response === 'Clear') {
			this.memoryGraph.clear();
			this.refreshVisualization();
			vscode.window.showInformationMessage('Memory graph cleared.');
		}
	}

	/**
	 * Exports the memory graph
	 */
	private async exportMemoryGraph(): Promise<void> {
		const graphData = this.memoryGraph.getGraphData();
		const exportData = JSON.stringify(graphData, null, 2);

		const uri = await vscode.window.showSaveDialog({
			defaultUri: vscode.Uri.file('aide-memory-graph.json'),
			filters: {
				'JSON Files': ['json'],
			},
		});

		if (uri) {
			await vscode.workspace.fs.writeFile(uri, Buffer.from(exportData));
			vscode.window.showInformationMessage('Memory graph exported successfully.');
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
	<title>AIDE - Memory Graph</title>
	<script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
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

		.content {
			flex: 1;
			display: flex;
			overflow: hidden;
		}

		.graph-container {
			flex: 1;
			position: relative;
		}

		#memory-graph {
			width: 100%;
			height: 100%;
			background: var(--vscode-editor-background);
		}

		.sidebar {
			width: 300px;
			background: var(--vscode-sideBar-background);
			border-left: 1px solid var(--vscode-panel-border);
			padding: 20px;
			overflow-y: auto;
		}

		.sidebar h3 {
			margin-bottom: 16px;
			font-size: 14px;
			font-weight: 600;
			text-transform: uppercase;
			opacity: 0.8;
		}

		.node-details {
			background: var(--vscode-editor-selectionBackground);
			border-radius: 4px;
			padding: 12px;
			margin-bottom: 16px;
		}

		.node-title {
			font-weight: 600;
			margin-bottom: 8px;
		}

		.node-type {
			background: var(--vscode-badge-background);
			color: var(--vscode-badge-foreground);
			padding: 2px 6px;
			border-radius: 2px;
			font-size: 11px;
			display: inline-block;
			margin-bottom: 8px;
		}

		.node-content {
			font-size: 13px;
			line-height: 1.4;
			margin-bottom: 8px;
		}

		.node-timestamp {
			font-size: 11px;
			opacity: 0.7;
		}

		.connected-nodes {
			margin-top: 16px;
		}

		.connected-node {
			background: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border);
			border-radius: 3px;
			padding: 8px;
			margin-bottom: 8px;
			cursor: pointer;
		}

		.connected-node:hover {
			background: var(--vscode-input-background);
			border-color: var(--vscode-focusBorder);
		}

		.connected-node-title {
			font-size: 12px;
			font-weight: 500;
			margin-bottom: 4px;
		}

		.connected-node-type {
			font-size: 10px;
			opacity: 0.8;
		}

		.stats {
			margin-bottom: 20px;
		}

		.stat-item {
			display: flex;
			justify-content: space-between;
			padding: 4px 0;
			font-size: 13px;
		}

		.stat-label {
			opacity: 0.8;
		}

		.stat-value {
			font-weight: 600;
		}

		.empty-state {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			height: 100%;
			text-align: center;
			opacity: 0.6;
		}

		.empty-state h2 {
			margin-bottom: 8px;
			font-size: 18px;
			font-weight: 300;
		}

		.empty-state p {
			font-size: 14px;
			max-width: 300px;
		}

		.legend {
			margin-top: 20px;
		}

		.legend-item {
			display: flex;
			align-items: center;
			margin-bottom: 8px;
			font-size: 12px;
		}

		.legend-color {
			width: 12px;
			height: 12px;
			border-radius: 50%;
			margin-right: 8px;
		}

		.type-intent { background: #007ACC; }
		.type-feature { background: #28A745; }
		.type-screen { background: #FD7E14; }
		.type-logic { background: #6F42C1; }
		.type-relationship { background: #DC3545; }
		.type-decision { background: #20C997; }
	</style>
</head>
<body>
	<div class="header">
		<h1>🧠 Memory Graph</h1>
		<div class="header-actions">
			<button class="btn btn-secondary" onclick="refreshGraph()">Refresh</button>
			<button class="btn btn-secondary" onclick="exportGraph()">Export</button>
			<button class="btn btn-secondary" onclick="clearGraph()">Clear</button>
		</div>
	</div>

	<div class="content">
		<div class="graph-container">
			<div id="memory-graph"></div>
			<div id="empty-state" class="empty-state" style="display: none;">
				<h2>No Memory Data</h2>
				<p>Start a conversation with AIDE to see your memory graph visualization here.</p>
			</div>
		</div>

		<div class="sidebar">
			<div class="stats" id="stats">
				<h3>Statistics</h3>
				<div class="stat-item">
					<span class="stat-label">Nodes:</span>
					<span class="stat-value" id="node-count">0</span>
				</div>
				<div class="stat-item">
					<span class="stat-label">Edges:</span>
					<span class="stat-value" id="edge-count">0</span>
				</div>
			</div>

			<div id="node-details-container" style="display: none;">
				<h3>Selected Node</h3>
				<div id="node-details"></div>
			</div>

			<div id="connected-nodes-container" style="display: none;">
				<h3>Connected Nodes</h3>
				<div id="connected-nodes"></div>
			</div>

			<div class="legend">
				<h3>Node Types</h3>
				<div class="legend-item">
					<div class="legend-color type-intent"></div>
					<span>Intent</span>
				</div>
				<div class="legend-item">
					<div class="legend-color type-feature"></div>
					<span>Feature</span>
				</div>
				<div class="legend-item">
					<div class="legend-color type-screen"></div>
					<span>Screen</span>
				</div>
				<div class="legend-item">
					<div class="legend-color type-logic"></div>
					<span>Logic</span>
				</div>
				<div class="legend-item">
					<div class="legend-color type-relationship"></div>
					<span>Relationship</span>
				</div>
				<div class="legend-item">
					<div class="legend-color type-decision"></div>
					<span>Decision</span>
				</div>
			</div>
		</div>
	</div>

	<script>
		const vscode = acquireVsCodeApi();
		let network = null;
		let nodes = new vis.DataSet([]);
		let edges = new vis.DataSet([]);

		// Color mapping for node types
		const nodeColors = {
			intent: '#007ACC',
			feature: '#28A745',
			screen: '#FD7E14',
			logic: '#6F42C1',
			relationship: '#DC3545',
			decision: '#20C997'
		};

		// Initialize network
		function initNetwork() {
			const container = document.getElementById('memory-graph');
			const data = { nodes: nodes, edges: edges };

			const options = {
				nodes: {
					shape: 'dot',
					size: 16,
					font: {
						size: 12,
						color: 'var(--vscode-editor-foreground)'
					},
					borderWidth: 2,
					borderWidthSelected: 4
				},
				edges: {
					width: 2,
					color: {
						color: 'var(--vscode-editor-foreground)',
						opacity: 0.6
					},
					smooth: {
						type: 'continuous'
					},
					arrows: {
						to: {
							enabled: true,
							scaleFactor: 0.8
						}
					}
				},
				physics: {
					enabled: true,
					barnesHut: {
						gravitationalConstant: -8000,
						centralGravity: 0.3,
						springLength: 95,
						springConstant: 0.04,
						damping: 0.09
					}
				},
				interaction: {
					hover: true,
					selectConnectedEdges: false
				}
			};

			network = new vis.Network(container, data, options);

			// Handle node selection
			network.on('selectNode', function(params) {
				if (params.nodes.length > 0) {
					const nodeId = params.nodes[0];
					vscode.postMessage({
						type: 'nodeSelected',
						nodeId: nodeId
					});
				}
			});

			// Handle deselection
			network.on('deselectNode', function() {
				hideNodeDetails();
			});
		}

		// Handle messages from extension
		window.addEventListener('message', event => {
			const message = event.data;

			switch (message.type) {
				case 'updateGraph':
					updateGraph(message.nodes, message.edges);
					break;
				case 'nodeDetails':
					showNodeDetails(message.node, message.connectedNodes);
					break;
			}
		});

		// Update graph with new data
		function updateGraph(nodeData, edgeData) {
			// Clear existing data
			nodes.clear();
			edges.clear();

			// Add nodes
			const visNodes = nodeData.map(node => ({
				id: node.id,
				label: truncateText(node.content, 30),
				color: {
					background: nodeColors[node.type] || '#666666',
					border: nodeColors[node.type] || '#666666'
				},
				title: \`Type: \${node.type}\\nContent: \${node.content}\\nTimestamp: \${new Date(node.timestamp).toLocaleString()}\`,
				type: node.type
			}));

			// Add edges
			const visEdges = edgeData.map(edge => ({
				id: edge.id,
				from: edge.from,
				to: edge.to,
				label: edge.type,
				title: \`Type: \${edge.type}\\nWeight: \${edge.weight}\`
			}));

			nodes.add(visNodes);
			edges.add(visEdges);

			// Update statistics
			updateStats(nodeData.length, edgeData.length);

			// Show/hide empty state
			const emptyState = document.getElementById('empty-state');
			const graphContainer = document.getElementById('memory-graph');

			if (nodeData.length === 0) {
				emptyState.style.display = 'flex';
				graphContainer.style.display = 'none';
			} else {
				emptyState.style.display = 'none';
				graphContainer.style.display = 'block';

				// Fit the network to show all nodes
				if (network) {
					setTimeout(() => network.fit(), 100);
				}
			}
		}

		// Show node details in sidebar
		function showNodeDetails(node, connectedNodes) {
			const detailsContainer = document.getElementById('node-details-container');
			const detailsElement = document.getElementById('node-details');

			detailsElement.innerHTML = \`
				<div class="node-details">
					<div class="node-title">\${truncateText(node.content, 50)}</div>
					<div class="node-type">\${node.type}</div>
					<div class="node-content">\${node.content}</div>
					<div class="node-timestamp">\${new Date(node.timestamp).toLocaleString()}</div>
				</div>
			\`;

			detailsContainer.style.display = 'block';

			// Show connected nodes
			if (connectedNodes && connectedNodes.length > 0) {
				const connectedContainer = document.getElementById('connected-nodes-container');
				const connectedElement = document.getElementById('connected-nodes');

				connectedElement.innerHTML = connectedNodes.map(connectedNode => \`
					<div class="connected-node" onclick="selectNode('\${connectedNode.id}')">
						<div class="connected-node-title">\${truncateText(connectedNode.content, 40)}</div>
						<div class="connected-node-type">\${connectedNode.type}</div>
					</div>
				\`).join('');

				connectedContainer.style.display = 'block';
			} else {
				document.getElementById('connected-nodes-container').style.display = 'none';
			}
		}

		// Hide node details
		function hideNodeDetails() {
			document.getElementById('node-details-container').style.display = 'none';
			document.getElementById('connected-nodes-container').style.display = 'none';
		}

		// Update statistics
		function updateStats(nodeCount, edgeCount) {
			document.getElementById('node-count').textContent = nodeCount;
			document.getElementById('edge-count').textContent = edgeCount;
		}

		// Select a specific node
		function selectNode(nodeId) {
			if (network) {
				network.selectNodes([nodeId]);
				network.focus(nodeId, { animation: true });
			}
		}

		// Utility function to truncate text
		function truncateText(text, maxLength) {
			if (text.length <= maxLength) return text;
			return text.substring(0, maxLength - 3) + '...';
		}

		// Button handlers
		function refreshGraph() {
			vscode.postMessage({ type: 'refreshGraph' });
		}

		function exportGraph() {
			vscode.postMessage({ type: 'exportGraph' });
		}

		function clearGraph() {
			vscode.postMessage({ type: 'clearGraph' });
		}

		// Initialize when page loads
		window.addEventListener('load', () => {
			initNetwork();
			// Request initial data
			refreshGraph();
		});
	</script>
</body>
</html>`;
	}
}
