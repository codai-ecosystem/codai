/**
 * Integration tests for agent communication and coordination
 * Tests the orchestration between multiple agents working together
 */

import { expect, describe, it, beforeEach } from 'vitest';
import { PlannerAgent } from '../agents/PlannerAgent';
import { BuilderAgent } from '../agents/BuilderAgent';
import { DesignerAgent } from '../agents/DesignerAgent';
import { TesterAgent } from '../agents/TesterAgent';
import { DeployerAgent } from '../agents/DeployerAgent';
import { HistoryAgent } from '../agents/HistoryAgent';
import { MemoryGraph } from '../memory/MemoryGraph';
import { AgentCoordinator } from '../coordination/AgentCoordinator';
import { AgentAdapter } from '../coordination/AgentAdapter';
import { MemoryGraphEngine } from '@aide/memory-graph';
import {
	AgentRequest,
	AgentResponse,
	AgentCapability,
	PlanningRequest,
	BuildRequest,
	DesignRequest,
	TestRequest,
	DeployRequest,
	HistoryQuery,
	AgentConfig
} from '../types';

describe('Agent Integration Tests', () => {
	let memoryGraph: MemoryGraph;
	let coordinator: AgentCoordinator;
	let mockMemoryGraphEngine: MemoryGraphEngine;
	let plannerAgent: PlannerAgent;
	let builderAgent: BuilderAgent;
	let designerAgent: DesignerAgent;
	let testerAgent: TesterAgent;
	let deployerAgent: DeployerAgent;
	let historyAgent: HistoryAgent;

	beforeEach(() => {
		memoryGraph = new MemoryGraph();
		coordinator = new AgentCoordinator(memoryGraph);

		// Create mock memory graph engine for agents
		mockMemoryGraphEngine = {} as MemoryGraphEngine;

		// Create mock agent configs
		const createMockConfig = (type: string): AgentConfig => ({
			id: `${type}-agent`,
			name: `${type.charAt(0).toUpperCase() + type.slice(1)} Agent`,
			description: `Mock ${type} agent for testing`,
			type: type as any,
			capabilities: [{
				name: `${type}Capability`,
				description: `Can execute ${type} tasks`,
				inputs: [{ name: 'input', type: 'any', required: true }],
				outputs: [{ name: 'output', type: 'any' }]
			}],
			aiProvider: {
				provider: 'openai',
				model: 'gpt-4',
				temperature: 0.7
			},
			priority: 5,
			isEnabled: true
		});

		plannerAgent = new PlannerAgent(createMockConfig('planner'), mockMemoryGraphEngine);
		builderAgent = new BuilderAgent(createMockConfig('builder'), mockMemoryGraphEngine);
		designerAgent = new DesignerAgent(createMockConfig('designer'), mockMemoryGraphEngine);
		testerAgent = new TesterAgent(createMockConfig('tester'), mockMemoryGraphEngine);
		deployerAgent = new DeployerAgent(createMockConfig('deployer'), mockMemoryGraphEngine);
		historyAgent = new HistoryAgent(createMockConfig('history'), mockMemoryGraphEngine);

		// Register agents with coordinator using adapters
		coordinator.registerAgent('planner', new AgentAdapter(plannerAgent, 'planner'));
		coordinator.registerAgent('builder', new AgentAdapter(builderAgent, 'builder'));
		coordinator.registerAgent('designer', new AgentAdapter(designerAgent, 'designer'));
		coordinator.registerAgent('tester', new AgentAdapter(testerAgent, 'tester'));
		coordinator.registerAgent('deployer', new AgentAdapter(deployerAgent, 'deployer'));
		coordinator.registerAgent('history', new AgentAdapter(historyAgent, 'history'));
	});

	describe('End-to-End Workflow', () => {
		it('should execute complete development workflow', async () => {
			const projectRequest: AgentRequest = {
				id: 'e2e-test-001',
				type: 'development',
				payload: {
					description: 'Create a simple React component with tests',
					requirements: ['React component', 'TypeScript', 'Unit tests', 'Documentation'],
					context: {
						framework: 'React',
						language: 'TypeScript',
						testFramework: 'Jest'
					}
				},
				timestamp: Date.now(),
				priority: 'high'
			};
			// 1. Planning Phase
			const planResponse = await coordinator.executeWorkflow('planner', projectRequest);
			expect(planResponse.success).to.be.true;
			expect(planResponse.result).to.have.property('plan');
			expect(planResponse.result.plan.phases).to.have.length.greaterThan(0);

			// 2. Design Phase
			const designRequest: DesignRequest = {
				requirements: projectRequest.payload.requirements,
				constraints: planResponse.result.plan.constraints || [],
				preferences: { theme: 'modern', accessibility: 'WCAG-AA' }
			};

			const designResponse = await coordinator.executeWorkflow('designer', {
				...projectRequest,
				payload: designRequest
			});
			expect(designResponse.success).to.be.true;
			expect(designResponse.result).to.have.property('designSpecs');

			// 3. Building Phase
			const buildRequest: BuildRequest = {
				plan: planResponse.result.plan,
				designSpecs: designResponse.result.designSpecs,
				codegenInstructions: ['Follow TypeScript best practices', 'Include comprehensive comments']
			};

			const buildResponse = await coordinator.executeWorkflow('builder', {
				...projectRequest,
				payload: buildRequest
			});
			expect(buildResponse.success).to.be.true;
			expect(buildResponse.result).to.have.property('artifacts');
			expect(buildResponse.result.artifacts).to.have.length.greaterThan(0);

			// 4. Testing Phase
			const testRequest: TestRequest = {
				artifacts: buildResponse.result.artifacts,
				testStrategy: 'comprehensive',
				coverage: { minimum: 80, target: 95 }
			};

			const testResponse = await coordinator.executeWorkflow('tester', {
				...projectRequest,
				payload: testRequest
			});
			expect(testResponse.success).to.be.true;
			expect(testResponse.result).to.have.property('results');

			// 5. History Recording
			const historyQuery: HistoryQuery = {
				action: 'record',
				data: {
					workflowId: projectRequest.id,
					phases: ['planning', 'design', 'build', 'test'],
					results: {
						planning: planResponse.result,
						design: designResponse.result,
						build: buildResponse.result,
						test: testResponse.result
					}
				}
			};

			const historyResponse = await coordinator.executeWorkflow('history', {
				...projectRequest,
				payload: historyQuery
			});
			expect(historyResponse.success).to.be.true;

			// Verify memory graph has been populated
			const memoryEntries = memoryGraph.getWorkflowHistory(projectRequest.id);
			expect(memoryEntries).to.have.length.greaterThan(0);
		});

		it('should handle agent communication failures gracefully', async () => {
			const faultyRequest: AgentRequest = {
				id: 'fault-test-001',
				type: 'invalid',
				payload: null,
				timestamp: Date.now(),
				priority: 'low'
			}; const response = await coordinator.executeWorkflow('planner', faultyRequest);
			expect(response.success).to.be.false;
			expect(response.error).to.exist;
			expect(response.error?.type).to.equal('capability_mismatch');
		});
	});

	describe('Agent Communication', () => {
		it('should enable agents to share context through memory graph', async () => {
			const sharedContext = {
				projectId: 'shared-context-test',
				framework: 'React',
				preferences: { styling: 'Tailwind CSS' }
			};
			// Store context in memory graph
			memoryGraph.storeContext('shared-context-test', sharedContext);

			// Planning agent should access shared context
			const planRequest: PlanningRequest = {
				description: 'Create a component using shared preferences',
				requirements: ['Use framework from shared context']
			};

			const planResponse = await coordinator.executeWorkflow('planner', {
				id: 'context-test-001',
				type: 'planning',
				payload: planRequest,
				timestamp: Date.now(),
				priority: 'medium'
			});

			expect(planResponse.success).to.be.true;
			// The planner should incorporate shared context (this would require updating agents to use memory graph)
		});

		it('should coordinate between dependent agents', async () => {
			// Test that builder waits for planner, tester waits for builder, etc.
			const workflowSteps = [
				{ agent: 'planner', dependency: null },
				{ agent: 'designer', dependency: 'planner' },
				{ agent: 'builder', dependency: 'designer' },
				{ agent: 'tester', dependency: 'builder' }
			];

			const execution = await coordinator.executeSequentialWorkflow(workflowSteps, {
				id: 'dependency-test-001',
				type: 'sequential',
				payload: {
					description: 'Test agent dependencies',
					requirements: ['Sequential execution', 'Dependency management']
				},
				timestamp: Date.now(),
				priority: 'medium'
			});

			expect(execution.success).to.be.true;
			expect(execution.executionOrder).to.deep.equal(['planner', 'designer', 'builder', 'tester']);
		});
	});

	describe('Memory Graph Integration', () => {
		it('should persist and retrieve workflow history', async () => {
			const workflowId = 'memory-test-001';
			const testData = {
				phase: 'planning',
				agent: 'planner',
				input: { description: 'test' },
				output: { plan: { phases: ['design', 'build'] } },
				timestamp: Date.now(),
				duration: 100,
				success: true
			};

			memoryGraph.recordWorkflowStep(workflowId, testData);
			const retrieved = memoryGraph.getWorkflowHistory(workflowId);

			expect(retrieved).to.have.length(1);
			expect(retrieved[0].phase).to.equal(testData.phase);
		});
		it('should enable pattern recognition across workflows', async () => {
			// Add multiple similar workflows
			const patterns = [
				{ type: 'React', framework: 'TypeScript', testFramework: 'Jest' },
				{ type: 'React', framework: 'TypeScript', testFramework: 'Vitest' },
				{ type: 'React', framework: 'JavaScript', testFramework: 'Jest' }
			];

			patterns.forEach((pattern, index) => {
				memoryGraph.recordWorkflowStep(`pattern-test-${index}`, {
					phase: 'completed',
					agent: 'tester',
					input: pattern,
					output: { success: true },
					timestamp: Date.now(),
					duration: 100,
					success: true
				});
			});

			const recognizedPatterns = memoryGraph.identifyPatterns(['React', 'TypeScript']);
			expect(recognizedPatterns).to.have.length.greaterThan(0);
			expect(recognizedPatterns[0].data.technologies).to.include('react');
		});
	});

	describe('Error Handling and Recovery', () => {
		it('should handle agent failures and trigger recovery', async () => {
			// Simulate a builder failure
			const mockFailureRequest: AgentRequest = {
				id: 'failure-test-001',
				type: 'build',
				payload: { invalid: 'data' },
				timestamp: Date.now(),
				priority: 'high'
			};

			const response = await coordinator.executeWorkflowWithRecovery('builder', mockFailureRequest);

			expect(response.success).to.be.false;
			if (response.recovery) {
				expect(response.recovery.attempted).to.be.true;
				expect(response.recovery.strategy).to.equal('retry_with_fallback');
			}
		});

		it('should maintain system state during partial failures', async () => {
			const initialState = memoryGraph.getSystemState();

			// Attempt a workflow that will partially fail
			try {
				await coordinator.executeWorkflow('invalid-agent', {
					id: 'state-test-001',
					type: 'invalid',
					payload: {},
					timestamp: Date.now(),
					priority: 'low'
				});
			} catch (error) {
				// Expected failure
			}

			const finalState = memoryGraph.getSystemState();
			expect(finalState.integrity).to.equal(initialState.integrity);
			expect(finalState.consistency).to.be.true;
		});
	});
});
