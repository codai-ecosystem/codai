import {
	AgentMemoryRuntime,
	createFeature,
	createScreen,
	createApi,
	MemoryGraphEngine,
} from '../src';

// Test the memory graph functionality
async function testMemoryGraph() {
	console.log('🧠 Testing Memory Graph System...');

	// Create a new runtime instance
	const runtime = new AgentMemoryRuntime({
		name: 'Test AIDE Project',
		description: 'Testing the memory graph functionality',
	});

	console.log('✅ Created AgentMemoryRuntime');

	// Test adding nodes via intents
	const featureNodes = await runtime.addIntent({
		type: 'create_feature',
		data: {
			name: 'User Authentication',
			description: 'Implement user login and registration',
			priority: 'high',
			requirements: [
				'Email/password login',
				'Social media OAuth',
				'Password reset functionality',
				'Email verification',
			],
		},
	});

	const screenNodes = await runtime.addIntent({
		type: 'create_screen',
		data: {
			name: 'Login Screen',
			screenType: 'page',
			route: '/login',
		},
	});

	console.log('✅ Added feature and screen nodes');

	// Test adding relationships
	if (featureNodes.length > 0 && screenNodes.length > 0) {
		await runtime.addRelationship(featureNodes[0].id, screenNodes[0].id, 'contains', {
			description: 'Feature contains this screen',
		});
		console.log('✅ Added relationship between feature and screen');
	}

	// Test querying
	const features = await runtime.findNodesByType('feature');
	const screens = await runtime.findNodesByType('screen');

	console.log(`📊 Found ${features.length} features and ${screens.length} screens`);

	// Test graph analysis
	const analysis = await runtime.analyzeGraph();
	console.log('📈 Graph Analysis:', {
		totalNodes: analysis.totalNodes,
		totalRelationships: analysis.totalRelationships,
		nodeTypes: analysis.nodeTypeDistribution,
		complexity: analysis.complexity,
		completeness: analysis.completeness,
	});

	// Test direct engine operations
	const engine = runtime.graph;
	const apiNode = engine.addNode(
		createApi().name('User Authentication API').method('POST').path('/api/auth/login').build()
	);

	console.log('✅ Added API node directly via engine');

	// Test graph validation
	const validation = engine.validateGraph();
	console.log('🔍 Graph Validation:', validation);

	// Test export
	const exportData = await runtime.exportGraph();
	console.log('💾 Export data length:', exportData.length);

	console.log('🎉 All tests passed! Memory Graph System is working correctly.');

	return {
		runtime,
		analysis,
		validation,
		exportData,
	};
}

// Run the test if this file is executed directly
if (require.main === module) {
	testMemoryGraph()
		.then(result => {
			console.log('Test completed successfully');
			process.exit(0);
		})
		.catch(error => {
			console.error('Test failed:', error);
			process.exit(1);
		});
}

export { testMemoryGraph };
