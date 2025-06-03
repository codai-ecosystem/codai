/**
 * Integration test for AIDE Core Extension
 * Tests the basic functionality of the integrated packages
 */

const { MemoryGraphEngine, FeatureNode } = require('@aide/memory-graph/core');
const { AgentRuntime } = require('@aide/agent-runtime');

console.log('🧪 Testing AIDE Integration...\n');

// Test 1: Memory Graph Engine
console.log('✅ Testing Memory Graph Engine...');
try {
	const engine = new MemoryGraphEngine();
	console.log('  ✓ MemoryGraphEngine created successfully');
	console.log('  ✓ Engine methods available:', Object.getOwnPropertyNames(Object.getPrototypeOf(engine)));
} catch (error) {
	console.error('  ❌ MemoryGraphEngine test failed:', error.message);
	process.exit(1);
}

// Test 2: Node Creation
console.log('\n✅ Testing Node Creation...');
try {
	const engine = new MemoryGraphEngine();

	const node = new FeatureNode({
		id: 'test-feature-1',
		name: 'Test Feature',
		description: 'A test feature for integration testing',
		status: 'planned',
		priority: 'high',
		requirements: ['User can test the feature'],
		createdAt: new Date(),
		updatedAt: new Date(),
		version: '1.0.0'
	});

	console.log('  ✓ FeatureNode created successfully');
	console.log('  ✓ Node ID:', node.id);
	console.log('  ✓ Node type:', node.type);
	console.log('  ✓ Node name:', node.name);
} catch (error) {
	console.error('  ❌ Node creation test failed:', error.message);
	console.error('  Details:', error);
	process.exit(1);
}

// Test 1: MemoryGraphEngine can be instantiated
try {
	const memoryEngine = new MemoryGraphEngine();
	console.log('✅ MemoryGraphEngine instantiated successfully');

	// Test basic node operations
	const intentNode = {
		id: 'test-intent-1',
		type: 'intent',
		name: 'Test Intent',
		description: 'Testing intent creation',
		category: 'test',
		priority: 'medium',
		status: 'active',
		context: 'Integration test'
	};

	memoryEngine.addNode(intentNode);
	console.log('✅ Node added to memory engine successfully');

	const retrievedNode = memoryEngine.getNode('test-intent-1');
	if (retrievedNode) {
		console.log('✅ Node retrieval working correctly');
	} else {
		console.log('❌ Node retrieval failed');
	}

} catch (error) {
	console.log('❌ MemoryGraphEngine test failed:', error.message);
}

// Test 2: AgentRuntime can be instantiated
try {
	const memoryEngine = new MemoryGraphEngine();
	const agentRuntime = new AgentRuntime(memoryEngine, {
		openai: 'test-key'
	});
	console.log('✅ AgentRuntime instantiated successfully');

} catch (error) {
	console.log('❌ AgentRuntime test failed:', error.message);
}

console.log('\n🎉 Integration test completed!');
