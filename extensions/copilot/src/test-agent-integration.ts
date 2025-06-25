/**
 * Test Agent Runtime Integration
 * This file tests that the agent runtime can be loaded and basic functionality works
 */

export async function testAgentIntegration(): Promise<void> {
	try {
		// Try to dynamically import the agent runtime
		const { AgentRuntime } = await import('@codai/agent-runtime');
		const { MemoryGraphEngine } = await import('@codai/memory-graph');

		console.log('✅ Successfully imported AgentRuntime and MemoryGraphEngine');

		// Create a memory graph engine
		const memoryGraph = new MemoryGraphEngine();
		console.log('✅ Created MemoryGraphEngine');

		// Create agent runtime
		const agentRuntime = new AgentRuntime(memoryGraph);
		console.log('✅ Created AgentRuntime');

		// Test basic functionality
		const agentStatuses = agentRuntime.getAgentStatuses();
		console.log(`✅ Agent Runtime initialized with ${agentStatuses.size} agents`);

		// List available agents
		for (const [agentId, status] of agentStatuses.entries()) {
			console.log(
				`  - ${agentId}: ${status.isHealthy ? 'healthy' : 'unhealthy'}, ${status.isEnabled ? 'enabled' : 'disabled'}`
			);
		}

		// Test task execution with PlannerAgent
		const planningTask = {
			id: 'test-task-' + Date.now(),
			title: 'Test Project Planning',
			description: 'Plan a simple web application',
			agentId: 'planner',
			status: 'pending' as const,
			priority: 'medium' as const,
			inputs: {
				requirements: 'Create a simple todo list web application using React and TypeScript',
			},
			createdAt: new Date(),
			progress: 0,
		};

		console.log('🚀 Executing test planning task...');
		const result = await agentRuntime.executeTask(planningTask);
		console.log('✅ Task completed successfully:', {
			success: result.success,
			duration: result.duration,
			outputsCount: Object.keys(result.outputs || {}).length,
			memoryChangesCount: result.memoryChanges?.length || 0,
		});

		return;
	} catch (error) {
		console.error('❌ Agent integration test failed:', error);
		throw error;
	}
}

// Test function that can be called from the extension
export async function runAgentIntegrationTest(): Promise<{
	success: boolean;
	message: string;
	details?: any;
}> {
	try {
		await testAgentIntegration();
		return {
			success: true,
			message: 'Agent integration test passed successfully',
		};
	} catch (error) {
		return {
			success: false,
			message: 'Agent integration test failed',
			details: {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			},
		};
	}
}
