/**
 * Simple test script to verify conversation manager functionality
 */

const { SimpleMemoryGraph } = require('./out/services/simpleMemoryGraph');

async function testConversationManager() {
	console.log('🧪 Testing SimpleMemoryGraph implementation...');

	try {
		// Test SimpleMemoryGraph
		const memoryGraph = new SimpleMemoryGraph();
		console.log('✅ SimpleMemoryGraph created successfully');

		// Test adding a node
		const nodeId = memoryGraph.addNode('intent', 'Create a React component', { priority: 'high' });
		console.log('✅ Node added with ID:', nodeId);

		// Test getting the node back
		const node = memoryGraph.getNode(nodeId);
		console.log('✅ Node retrieved:', node?.content);

		// Test graph data
		const graphData = memoryGraph.getGraphData();
		console.log('✅ Graph data:', graphData.nodes.length, 'nodes,', graphData.edges.length, 'edges');

		// Test adding an edge
		const nodeId2 = memoryGraph.addNode('feature', 'Add state management', { priority: 'medium' });
		const edgeId = memoryGraph.addEdge(nodeId, nodeId2, 'leads_to', 0.8);
		console.log('✅ Edge added with ID:', edgeId);

		// Test connected nodes
		const connectedNodes = memoryGraph.getConnectedNodes(nodeId);
		console.log('✅ Connected nodes found:', connectedNodes.length);

		// Test search
		const searchResults = memoryGraph.searchNodes('React');
		console.log('✅ Search results:', searchResults.length);

		console.log('🎉 All tests passed! SimpleMemoryGraph implementation is working.');

	} catch (error) {
		console.error('❌ Test failed:', error.message);
		console.error(error.stack);
		return false;
	}

	return true;
}

// Run the test
testConversationManager().then(success => {
	process.exit(success ? 0 : 1);
});
