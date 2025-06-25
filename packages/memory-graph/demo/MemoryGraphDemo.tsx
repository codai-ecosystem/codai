import React, { useState } from 'react';
import { MemoryGraphVisualization, MemoryGraphEngine, createMemoryGraph } from '../src';

// Sample data for demonstration
const sampleGraph = createMemoryGraph({
	nodes: [
		{
			id: 'user-auth',
			type: 'feature',
			name: 'User Authentication',
			description: 'Login and registration functionality',
		},
		{
			id: 'login-screen',
			type: 'screen',
			name: 'Login Screen',
			description: 'UI for user login',
		},
		{
			id: 'auth-service',
			type: 'api',
			name: 'Auth Service',
			description: 'Backend authentication service',
		},
		{
			id: 'user-model',
			type: 'data_model',
			name: 'User Model',
			description: 'User data structure',
		},
		{
			id: 'auth-logic',
			type: 'logic',
			name: 'Auth Logic',
			description: 'Authentication business logic',
		},
		{
			id: 'auth-tests',
			type: 'test',
			name: 'Auth Tests',
			description: 'Unit tests for authentication',
		},
	],
	relationships: [
		{
			id: 'rel-1',
			fromNodeId: 'user-auth',
			toNodeId: 'login-screen',
			type: 'contains',
			strength: 0.8,
		},
		{
			id: 'rel-2',
			fromNodeId: 'login-screen',
			toNodeId: 'auth-service',
			type: 'uses',
			strength: 0.9,
		},
		{
			id: 'rel-3',
			fromNodeId: 'auth-service',
			toNodeId: 'user-model',
			type: 'depends_on',
			strength: 0.7,
		},
		{
			id: 'rel-4',
			fromNodeId: 'auth-service',
			toNodeId: 'auth-logic',
			type: 'implements',
			strength: 0.8,
		},
		{
			id: 'rel-5',
			fromNodeId: 'auth-tests',
			toNodeId: 'auth-logic',
			type: 'tests',
			strength: 0.6,
		},
	],
});

export const MemoryGraphDemo: React.FC = () => {
	const [graph, setGraph] = useState(sampleGraph);
	const [selectedNode, setSelectedNode] = useState<string | null>(null);
	const [isEditable, setIsEditable] = useState(true);

	const handleNodeSelect = (nodeId: string) => {
		console.log('Node selected:', nodeId);
		setSelectedNode(nodeId);
	};

	const handleNodeUpdate = (nodeId: string, updates: any) => {
		console.log('Node update:', nodeId, updates);
		// In a real app, you would update the graph here
	};

	const handleRelationshipDelete = (relationshipId: string) => {
		console.log('Relationship delete:', relationshipId);
		const engine = new MemoryGraphEngine(graph);
		engine.removeRelationship(relationshipId);
		setGraph(engine.getGraph());
	};

	const addRandomNode = () => {
		const engine = new MemoryGraphEngine(graph);
		const nodeTypes = ['feature', 'screen', 'logic', 'data_model', 'api', 'test'];
		const randomType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];

		const newNode = engine.addNode({
			type: randomType as any,
			name: `New ${randomType} ${Date.now()}`,
			description: `A new ${randomType} node added dynamically`,
		});

		// Add a random relationship to an existing node
		const existingNodes = graph.nodes;
		if (existingNodes.length > 0) {
			const randomNode = existingNodes[Math.floor(Math.random() * existingNodes.length)];
			engine.addRelationship({
				fromNodeId: newNode.id,
				toNodeId: randomNode.id,
				type: 'uses',
				strength: Math.random(),
			});
		}

		setGraph(engine.getGraph());
	};

	return (
		<div className="p-6 bg-gray-50 min-h-screen">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-900 mb-6">Memory Graph Visualization Demo</h1>

				<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-xl font-semibold text-gray-800">Interactive Graph</h2>
						<div className="flex gap-3">
							<button
								onClick={addRandomNode}
								className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
							>
								Add Random Node
							</button>
							<label className="flex items-center gap-2">
								<input
									type="checkbox"
									checked={isEditable}
									onChange={e => setIsEditable(e.target.checked)}
									className="rounded"
								/>
								<span className="text-sm text-gray-600">Editable</span>
							</label>
						</div>
					</div>

					<div className="h-96 border border-gray-200 rounded-lg">
						<MemoryGraphVisualization
							graph={graph}
							onNodeSelect={handleNodeSelect}
							onNodeUpdate={handleNodeUpdate}
							onRelationshipDelete={handleRelationshipDelete}
							isEditable={isEditable}
							layout="force"
							className="w-full h-full"
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="bg-white rounded-lg shadow p-6">
						<h3 className="text-lg font-semibold text-gray-800 mb-4">Graph Statistics</h3>
						<div className="space-y-2 text-sm text-gray-600">
							<div>Nodes: {graph.nodes.length}</div>
							<div>Relationships: {graph.relationships.length}</div>
							<div>Selected Node: {selectedNode || 'None'}</div>
						</div>
					</div>

					<div className="bg-white rounded-lg shadow p-6">
						<h3 className="text-lg font-semibold text-gray-800 mb-4">Instructions</h3>
						<ul className="space-y-2 text-sm text-gray-600">
							<li>• Click nodes to select them</li>
							<li>• Drag to pan the view</li>
							<li>• Scroll to zoom in/out</li>
							<li>• Use controls to change layout</li>
							<li>• Click "Add Random Node" to test dynamic updates</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
};
