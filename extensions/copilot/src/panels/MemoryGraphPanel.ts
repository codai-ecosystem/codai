import * as vscode from 'vscode';
import { MemoryGraphEngine, AnyNode, Relationship } from '@aide/memory-graph';

/**
 * MemoryGraphPanel - Visual representation of the memory graph
 * Shows nodes, relationships, and allows interactive exploration of the project structure
 */
export class MemoryGraphPanel {
	private panel: vscode.WebviewPanel | undefined;
	private disposables: vscode.Disposable[] = [];

	constructor(
		private context: vscode.ExtensionContext,
		private memoryGraph: MemoryGraphEngine
	) {
		// Subscribe to memory graph changes
		this.memoryGraph.changes$.subscribe(change => {
			this.postMessage({
				type: 'graph_change',
				data: change
			});
		});

		this.memoryGraph.graph$.subscribe(graph => {
			this.postMessage({
				type: 'graph_update',
				data: graph
			});
		});
	}

	public show(): void {
		if (this.panel) {
			this.panel.reveal();
			return;
		}
		this.panel = vscode.window.createWebviewPanel(
			'aide.memoryGraph',
			'AIDE Memory Graph',
			vscode.ViewColumn.Two,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [
					vscode.Uri.file(this.context.asAbsolutePath('dist')),
					vscode.Uri.file(this.context.asAbsolutePath('assets'))
				]
			}
		);

		this.panel.webview.html = this.getWebviewContent();
		this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

		// Handle messages from webview
		this.panel.webview.onDidReceiveMessage(
			async message => {
				switch (message.type) {
					case 'node_selected':
						await this.handleNodeSelected(message.data);
						break;
					case 'node_edit':
						await this.handleNodeEdit(message.data);
						break;
					case 'request_graph':
						await this.sendCurrentGraph();
						break;
				}
			},
			null,
			this.disposables
		);

		this.sendCurrentGraph();
	}

	private async handleNodeSelected(nodeId: string) {
		const node = this.memoryGraph.getNode(nodeId);
		if (node) {
			this.postMessage({
				type: 'node_details',
				data: {
					node,
					relationships: this.getNodeRelationships(nodeId)
				}
			});
		}
	}

	private async handleNodeEdit(data: { nodeId: string; updates: Partial<AnyNode> }) {
		try {
			const updatedNode = this.memoryGraph.updateNode(data.nodeId, data.updates);
			if (updatedNode) {
				this.postMessage({
					type: 'node_updated',
					data: updatedNode
				});
			}
		} catch (error) {
			this.postMessage({
				type: 'error',
				data: { message: `Error updating node: ${error}` }
			});
		}
	}

	private async sendCurrentGraph() {
		const graph = this.memoryGraph.currentGraph;
		this.postMessage({
			type: 'graph_update',
			data: graph
		});
	}

	private getNodeRelationships(nodeId: string): { incoming: Relationship[]; outgoing: Relationship[] } {
		const relationships = this.memoryGraph.relationships;
		return {
			incoming: relationships.filter(r => r.toNodeId === nodeId),
			outgoing: relationships.filter(r => r.fromNodeId === nodeId)
		};
	}

	private postMessage(message: any) {
		if (this.panel) {
			this.panel.webview.postMessage(message);
		}
	} private getWebviewContent(): string {
		// Create a simple file path for scripts - compatibility fallback
		const scriptPath = this.context.asAbsolutePath('dist/memory-graph.js');
		const webviewScriptUri = vscode.Uri.file(scriptPath).toString();

		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>AIDE Memory Graph</title>
			<script src="https://d3js.org/d3.v7.min.js"></script>
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

				.graph-container {
					flex: 1;
					display: flex;
					overflow: hidden;
				}

				.graph-area {
					flex: 1;
					position: relative;
				}

				.sidebar {
					width: 300px;
					border-left: 1px solid var(--vscode-panel-border);
					padding: 1rem;
					overflow-y: auto;
					background-color: var(--vscode-sideBar-background);
				}

				.node-details {
					display: none;
				}

				.node-details.visible {
					display: block;
				}

				.node-title {
					font-size: 1.1rem;
					font-weight: 600;
					margin-bottom: 0.5rem;
					color: var(--vscode-foreground);
				}

				.node-type {
					display: inline-block;
					padding: 0.25rem 0.5rem;
					border-radius: 0.25rem;
					font-size: 0.8rem;
					font-weight: 500;
					margin-bottom: 1rem;
				}

				.node-description {
					color: var(--vscode-descriptionForeground);
					margin-bottom: 1rem;
					line-height: 1.4;
				}

				.relationships-section {
					margin-top: 1rem;
				}

				.section-title {
					font-weight: 600;
					margin-bottom: 0.5rem;
					color: var(--vscode-foreground);
				}

				.relationship-item {
					padding: 0.5rem;
					margin-bottom: 0.5rem;
					background-color: var(--vscode-input-background);
					border-radius: 0.25rem;
					font-size: 0.9rem;
				}

				.toolbar {
					padding: 0.5rem 1rem;
					border-bottom: 1px solid var(--vscode-panel-border);
					display: flex;
					gap: 0.5rem;
					align-items: center;
				}

				.toolbar-button {
					padding: 0.25rem 0.75rem;
					background-color: var(--vscode-button-secondaryBackground);
					color: var(--vscode-button-secondaryForeground);
					border: none;
					border-radius: 0.25rem;
					cursor: pointer;
					font-size: 0.9rem;
				}

				.toolbar-button:hover {
					background-color: var(--vscode-button-secondaryHoverBackground);
				}

				.graph-svg {
					width: 100%;
					height: 100%;
				}

				.node {
					cursor: pointer;
					stroke-width: 2;
				}

				.node.selected {
					stroke-width: 3;
					stroke: var(--vscode-focusBorder);
				}

				.node-text {
					font-family: var(--vscode-font-family);
					font-size: 12px;
					fill: var(--vscode-foreground);
					text-anchor: middle;
					dominant-baseline: central;
					pointer-events: none;
				}

				.link {
					stroke: var(--vscode-descriptionForeground);
					stroke-width: 2;
					fill: none;
					marker-end: url(#arrowhead);
				}

				.empty-state {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					height: 100%;
					color: var(--vscode-descriptionForeground);
					text-align: center;
				}

				.empty-state-title {
					font-size: 1.2rem;
					margin-bottom: 0.5rem;
					color: var(--vscode-foreground);
				}
			</style>
		</head>
		<body>
			<div class="toolbar">
				<button class="toolbar-button" onclick="resetZoom()">Reset View</button>
				<button class="toolbar-button" onclick="toggleLayout()">Toggle Layout</button>
				<span style="margin-left: auto; font-size: 0.9rem; color: var(--vscode-descriptionForeground);">
					Nodes: <span id="nodeCount">0</span> | Relationships: <span id="relationshipCount">0</span>
				</span>
			</div>

			<div class="graph-container">
				<div class="graph-area">
					<div id="emptyState" class="empty-state">
						<h3 class="empty-state-title">No Project Loaded</h3>
						<p>Start a conversation to begin building your project</p>
					</div>
					<svg id="graphSvg" class="graph-svg" style="display: none;"></svg>
				</div>

				<div class="sidebar">
					<div id="nodeDetails" class="node-details">
						<div class="node-title" id="nodeTitle">Node Details</div>
						<div class="node-type" id="nodeType"></div>
						<div class="node-description" id="nodeDescription"></div>

						<div class="relationships-section">
							<div class="section-title">Incoming Relationships</div>
							<div id="incomingRelationships"></div>
						</div>

						<div class="relationships-section">
							<div class="section-title">Outgoing Relationships</div>
							<div id="outgoingRelationships"></div>
						</div>
					</div>

					<div id="graphInfo" class="node-details visible">
						<div class="node-title">Memory Graph</div>
						<div class="node-description">
							Visual representation of your project's structure, features, and relationships.
							Click on nodes to explore details.
						</div>
					</div>
				</div>
			</div>

			<script>
				const vscode = acquireVsCodeApi();

				let graphData = null;
				let simulation = null;
				let svg = null;
				let selectedNode = null;

				// Color mapping for node types
				const nodeColors = {
					feature: '#4CAF50',
					screen: '#2196F3',
					logic: '#FF9800',
					data_model: '#9C27B0',
					api: '#F44336',
					test: '#795548',
					deployment: '#607D8B'
				};

				// Handle messages from extension
				window.addEventListener('message', event => {
					const message = event.data;

					switch (message.type) {
						case 'graph_update':
							updateGraph(message.data);
							break;
						case 'graph_change':
							handleGraphChange(message.data);
							break;
						case 'node_details':
							showNodeDetails(message.data);
							break;
						case 'error':
							console.error('Graph error:', message.data.message);
							break;
					}
				});

				function updateGraph(graph) {
					graphData = graph;

					document.getElementById('nodeCount').textContent = graph.nodes.length;
					document.getElementById('relationshipCount').textContent = graph.relationships.length;

					if (graph.nodes.length === 0) {
						document.getElementById('emptyState').style.display = 'flex';
						document.getElementById('graphSvg').style.display = 'none';
					} else {
						document.getElementById('emptyState').style.display = 'none';
						document.getElementById('graphSvg').style.display = 'block';
						renderGraph(graph);
					}
				}

				function renderGraph(graph) {
					const container = document.querySelector('.graph-area');
					const width = container.clientWidth;
					const height = container.clientHeight;

					// Clear existing graph
					d3.select('#graphSvg').selectAll('*').remove();

					svg = d3.select('#graphSvg')
						.attr('width', width)
						.attr('height', height);

					// Add arrowhead marker
					svg.append('defs').append('marker')
						.attr('id', 'arrowhead')
						.attr('viewBox', '-0 -5 10 10')
						.attr('refX', 13)
						.attr('refY', 0)
						.attr('orient', 'auto')
						.append('path')
						.attr('d', 'M 0,-5 L 10 ,0 L 0,5')
						.attr('fill', 'var(--vscode-descriptionForeground)');

					// Create simulation
					simulation = d3.forceSimulation(graph.nodes)
						.force('link', d3.forceLink(graph.relationships).id(d => d.id).distance(100))
						.force('charge', d3.forceManyBody().strength(-300))
						.force('center', d3.forceCenter(width / 2, height / 2));

					// Add links
					const link = svg.append('g')
						.selectAll('line')
						.data(graph.relationships)
						.enter().append('line')
						.attr('class', 'link');

					// Add nodes
					const node = svg.append('g')
						.selectAll('circle')
						.data(graph.nodes)
						.enter().append('circle')
						.attr('class', 'node')
						.attr('r', 20)
						.attr('fill', d => nodeColors[d.type] || '#666')
						.call(d3.drag()
							.on('start', dragstarted)
							.on('drag', dragged)
							.on('end', dragended))
						.on('click', nodeClicked);

					// Add labels
					const label = svg.append('g')
						.selectAll('text')
						.data(graph.nodes)
						.enter().append('text')
						.attr('class', 'node-text')
						.text(d => d.name);

					// Update positions on simulation tick
					simulation.on('tick', () => {
						link
							.attr('x1', d => d.source.x)
							.attr('y1', d => d.source.y)
							.attr('x2', d => d.target.x)
							.attr('y2', d => d.target.y);

						node
							.attr('cx', d => d.x)
							.attr('cy', d => d.y);

						label
							.attr('x', d => d.x)
							.attr('y', d => d.y);
					});
				}

				function nodeClicked(event, d) {
					// Update selection
					d3.selectAll('.node').classed('selected', false);
					d3.select(this).classed('selected', true);

					selectedNode = d;
					vscode.postMessage({
						type: 'node_selected',
						data: d.id
					});
				}

				function showNodeDetails(data) {
					const { node, relationships } = data;

					document.getElementById('graphInfo').classList.remove('visible');
					document.getElementById('nodeDetails').classList.add('visible');

					document.getElementById('nodeTitle').textContent = node.name;
					document.getElementById('nodeType').textContent = node.type;
					document.getElementById('nodeType').style.backgroundColor = nodeColors[node.type] || '#666';
					document.getElementById('nodeDescription').textContent = node.description || 'No description available';

					// Show relationships
					const incomingEl = document.getElementById('incomingRelationships');
					const outgoingEl = document.getElementById('outgoingRelationships');

					incomingEl.innerHTML = relationships.incoming.map(r =>
						\`<div class="relationship-item">\${r.type} from \${getNodeName(r.fromNodeId)}</div>\`
					).join('') || '<div style="color: var(--vscode-descriptionForeground);">None</div>';

					outgoingEl.innerHTML = relationships.outgoing.map(r =>
						\`<div class="relationship-item">\${r.type} to \${getNodeName(r.toNodeId)}</div>\`
					).join('') || '<div style="color: var(--vscode-descriptionForeground);">None</div>';
				}

				function getNodeName(nodeId) {
					const node = graphData?.nodes.find(n => n.id === nodeId);
					return node ? node.name : 'Unknown';
				}

				function handleGraphChange(change) {
					// Refresh the graph when changes occur
					if (graphData) {
						vscode.postMessage({ type: 'request_graph' });
					}
				}

				// Drag functions
				function dragstarted(event, d) {
					if (!event.active) simulation.alphaTarget(0.3).restart();
					d.fx = d.x;
					d.fy = d.y;
				}

				function dragged(event, d) {
					d.fx = event.x;
					d.fy = event.y;
				}

				function dragended(event, d) {
					if (!event.active) simulation.alphaTarget(0);
					d.fx = null;
					d.fy = null;
				}

				// Toolbar functions
				function resetZoom() {
					if (simulation) {
						simulation.alpha(1).restart();
					}
				}

				function toggleLayout() {
					// Switch between force and hierarchical layouts
					// Implementation would depend on specific requirements
					console.log('Layout toggle not yet implemented');
				}

				// Request initial graph data
				vscode.postMessage({ type: 'request_graph' });
			</script>
		</body>
		</html>`;
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
