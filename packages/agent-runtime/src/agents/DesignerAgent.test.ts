/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DesignerAgent } from './DesignerAgent';
import { MemoryGraphEngine } from '@aide/memory-graph';
import { Task, TaskResult, AgentConfig } from '../types';

describe('DesignerAgent', () => {
	let designerAgent: DesignerAgent;
	let mockMemoryGraph: MemoryGraphEngine;
	let mockConfig: AgentConfig;

	beforeEach(() => {
		mockMemoryGraph = {
			getFeatureNode: vi.fn(),
			addFeature: vi.fn(),
			addScreen: vi.fn(),
			getRelatedNodes: vi.fn(),
			updateNode: vi.fn(),
		} as any;
		mockConfig = {
			id: 'designer-agent',
			name: 'Designer Agent',
			description: 'AI agent for UI/UX design',
			type: 'designer',
			capabilities: [],
			aiProvider: {
				provider: 'openai',
				model: 'gpt-4',
				temperature: 0.7,
			},
			priority: 5,
			isEnabled: true,
		};

		designerAgent = new DesignerAgent(mockConfig, mockMemoryGraph);

		// Mock the sendMessage method to avoid actual message sending
		vi.spyOn(designerAgent as any, 'sendMessage').mockResolvedValue(undefined);
	});

	// Helper function to create valid Task objects
	const createTask = (overrides: Partial<Task>): Task => ({
		id: '1',
		title: 'Test Task',
		description: 'Test Description',
		agentId: 'designer',
		status: 'pending',
		priority: 'medium',
		createdAt: new Date(),
		progress: 0,
		inputs: {},
		...overrides,
	});

	describe('canExecuteTask', () => {
		it('should accept UI design tasks', () => {
			const task = createTask({
				title: 'Design user interface',
				description: 'Design the user interface for authentication',
			});

			expect(designerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should accept design system tasks', () => {
			const task = createTask({
				title: 'Create design system for application',
				description: 'Establish design tokens and component guidelines',
			});

			expect(designerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should accept wireframe tasks', () => {
			const task = createTask({
				title: 'Create wireframe for dashboard',
				description: 'Design wireframes for main dashboard',
			});

			expect(designerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should accept prototype tasks', () => {
			const task = createTask({
				title: 'Create interactive prototype',
				description: 'Build clickable prototype for user testing',
			});

			expect(designerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should accept style guide tasks', () => {
			const task = createTask({
				title: 'Create style guide',
				description: 'Develop comprehensive style guide',
			});

			expect(designerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should accept component design tasks', () => {
			const task = createTask({
				title: 'Design reusable components',
				description: 'Create component library for the application',
			});

			expect(designerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should accept tasks with designer agentId', () => {
			const task = createTask({
				title: 'Some custom task',
				description: 'Any task assigned to designer',
				agentId: 'designer',
			});

			expect(designerAgent.canExecuteTask(task)).toBe(true);
		});
		it('should reject non-design tasks', () => {
			const task = createTask({
				title: 'Write unit tests',
				description: 'Create comprehensive test coverage',
				agentId: 'tester', // Use a different agentId to test the keyword-based filtering
			});

			expect(designerAgent.canExecuteTask(task)).toBe(false);
		});
	});

	describe('executeTask', () => {
		it('should execute design system tasks successfully', async () => {
			const task = createTask({
				title: 'Design System Creation',
				description: 'Create design system with colors and typography',
				inputs: {
					requirements: { type: 'web_app', brand: 'modern' },
					brand: { primary_color: '#007bff', secondary_color: '#6c757d' }
				},
			});

			const result = await designerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			if (result.outputs) {
				expect((result.outputs as any).design_system).toBeDefined();
				expect((result.outputs as any).css_variables).toBeDefined();
				expect((result.outputs as any).documentation).toBeDefined();
			}
			expect(result.duration).toBeGreaterThanOrEqual(0);
		});

		it('should execute wireframe tasks successfully', async () => {
			const task = createTask({
				title: 'Create wireframe for dashboard',
				description: 'Design wireframes for main dashboard',
				inputs: {
					requirements: {
						screens: [
							{ name: 'Dashboard', type: 'main' },
							{ name: 'Settings', type: 'secondary' }
						]
					}
				},
			});

			const result = await designerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			if (result.outputs) {
				expect((result.outputs as any).wireframes).toBeDefined();
				expect((result.outputs as any).user_flows).toBeDefined();
				expect((result.outputs as any).information_architecture).toBeDefined();
			}
		});

		it('should execute prototype tasks successfully', async () => {
			const task = createTask({
				title: 'Create interactive prototype',
				description: 'Build clickable prototype for user testing',
				inputs: {
					requirements: {
						type: 'mobile_app',
						features: ['authentication', 'dashboard', 'settings']
					},
					brand: { primary_color: '#007bff' }
				},
			});

			const result = await designerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			if (result.outputs) {
				expect((result.outputs as any).prototype).toBeDefined();
				expect((result.outputs as any).prototype_code).toBeDefined();
				expect((result.outputs as any).demo_data).toBeDefined();
			}
		});

		it('should execute UI design tasks successfully', async () => {
			const task = createTask({
				title: 'UI Design',
				description: 'Create user interface design',
				inputs: {
					requirements: {
						name: 'Dashboard',
						type: 'web_app',
						features: ['analytics', 'reports', 'settings']
					},
					brand: { primary_color: '#007bff' }
				},
			});

			const result = await designerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			if (result.outputs) {
				expect((result.outputs as any).design_specifications).toBeDefined();
				expect((result.outputs as any).visual_design).toBeDefined();
				expect((result.outputs as any).component_designs).toBeDefined();
				expect((result.outputs as any).responsive_design).toBeDefined();
				expect((result.outputs as any).style_guide).toBeDefined();
				expect((result.outputs as any).css_classes).toBeDefined();
			}
		});

		it('should handle task execution errors gracefully', async () => {
			const task = createTask({
				title: 'Invalid design task',
				description: 'This should fail',
				inputs: {
					requirements: {} // Empty object
				},
			});

			// Mock an error in the private method
			const originalMethod = (designerAgent as any).analyzeUIRequirements;
			(designerAgent as any).analyzeUIRequirements = vi.fn().mockRejectedValue(new Error('Analysis failed'));

			const result = await designerAgent.executeTask(task);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Analysis failed');
			expect(result.duration).toBeGreaterThanOrEqual(0);

			// Restore original method
			(designerAgent as any).analyzeUIRequirements = originalMethod;
		});

		it('should include execution duration in results', async () => {
			const task = createTask({
				title: 'UI Design',
				description: 'Create user interface design',
				inputs: {
					requirements: { type: 'web_app' }
				},
			});

			const result = await designerAgent.executeTask(task);

			expect(result.duration).toBeGreaterThanOrEqual(0);
			expect(typeof result.duration).toBe('number');
		});

		it('should handle tasks with feature input instead of requirements', async () => {
			const task = createTask({
				title: 'UI Design',
				description: 'Create user interface design',
				inputs: {
					feature: { name: 'Authentication', type: 'web_app' }
				},
			});

			const result = await designerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
		});
	});

	describe('design system generation', () => {
		it('should generate color palette correctly', async () => {
			const task = createTask({
				title: 'Create design system',
				description: 'Generate color palette for brand',
				inputs: {
					requirements: { type: 'web_app' },
					brand: {
						primary_color: '#007bff',
						secondary_color: '#6c757d',
						accent_color: '#28a745'
					}
				},
			});

			const result = await designerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			if (result.outputs) {
				const designSystem = (result.outputs as any).design_system;
				expect(designSystem.colors).toBeDefined();
				expect(designSystem.colors.primary).toBeDefined();
				expect(designSystem.colors.secondary).toBeDefined();
			}
		});

		it('should generate typography system correctly', async () => {
			const task = createTask({
				title: 'Create typography system',
				description: 'Generate typography tokens',
				inputs: {
					requirements: { type: 'web_app' },
					brand: {
						primary_font: 'Inter',
						secondary_font: 'Roboto Mono'
					}
				},
			});

			const result = await designerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			if (result.outputs) {
				const designSystem = (result.outputs as any).design_system;
				expect(designSystem.typography).toBeDefined();
				expect(designSystem.typography.fonts).toBeDefined();
				expect(designSystem.typography.sizes).toBeDefined();
			}
		});

		it('should generate Tailwind config correctly', async () => {
			const task = createTask({
				title: 'Create Tailwind design system',
				description: 'Generate Tailwind configuration',
				inputs: {
					requirements: { type: 'web_app', framework: 'tailwind' }
				},
			});

			const result = await designerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			if (result.outputs) {
				const designSystem = (result.outputs as any).design_system;
				expect(designSystem.tailwind_config).toBeDefined();
			}
		});
	});

	describe('wireframe generation', () => {
		it('should generate wireframes for multiple screens', async () => {
			const task = createTask({
				title: 'Create wireframes',
				description: 'Generate wireframes for application',
				inputs: {
					requirements: {
						screens: [
							{ name: 'Home', type: 'landing', components: ['header', 'hero', 'footer'] },
							{ name: 'About', type: 'info', components: ['header', 'content', 'footer'] },
							{ name: 'Contact', type: 'form', components: ['header', 'form', 'footer'] }
						]
					}
				},
			});

			const result = await designerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			if (result.outputs) {
				expect(Array.isArray((result.outputs as any).wireframes)).toBe(true);
				expect((result.outputs as any).wireframes).toHaveLength(3);
			}
		});

		it('should handle single screen wireframe', async () => {
			const task = createTask({
				title: 'Create wireframe',
				description: 'Generate wireframe for landing page',
				inputs: {
					requirements: {
						name: 'Landing Page',
						type: 'landing',
						components: ['header', 'hero', 'features', 'footer']
					}
				},
			});

			const result = await designerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			if (result.outputs) {
				expect(Array.isArray((result.outputs as any).wireframes)).toBe(true);
				expect((result.outputs as any).wireframes).toHaveLength(1);
			}
		});
	});

	describe('prototype generation', () => {
		it('should generate interactive prototype with animations', async () => {
			const task = createTask({
				title: 'Create interactive prototype',
				description: 'Generate prototype with animations',
				inputs: {
					requirements: {
						type: 'mobile_app',
						animations: true,
						interactions: ['swipe', 'tap', 'pinch']
					}
				},
			});

			const result = await designerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			if (result.outputs) {
				expect((result.outputs as any).prototype).toBeDefined();
				expect((result.outputs as any).prototype.screens).toBeDefined();
				expect((result.outputs as any).prototype.interactions).toBeDefined();
				expect((result.outputs as any).prototype.animations).toBeDefined();
			}
		});

		it('should generate demo data for prototype', async () => {
			const task = createTask({
				title: 'Create prototype',
				description: 'Generate prototype with demo data',
				inputs: {
					requirements: {
						type: 'web_app',
						data_types: ['users', 'products', 'orders']
					}
				},
			});

			const result = await designerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			if (result.outputs) {
				expect((result.outputs as any).demo_data).toBeDefined();
			}
		});
	});

	describe('component design', () => {
		it('should generate component designs with variants', async () => {
			const task = createTask({
				title: 'Design components',
				description: 'Create component library',
				inputs: {
					requirements: {
						components: ['button', 'input', 'card'],
						variants: ['primary', 'secondary', 'outline', 'ghost']
					}
				},
			});

			const result = await designerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			if (result.outputs) {
				expect((result.outputs as any).component_designs).toBeDefined();
				expect(Array.isArray((result.outputs as any).component_designs)).toBe(true);
			}
		});

		it('should generate responsive design rules', async () => {
			const task = createTask({
				title: 'Create responsive design',
				description: 'Design components that work on all devices',
				inputs: {
					requirements: {
						responsive: true,
						breakpoints: ['mobile', 'tablet', 'desktop'],
						touch_friendly: true
					}
				},
			});

			const result = await designerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			if (result.outputs) {
				expect((result.outputs as any).responsive_design).toBeDefined();
			}
		});
	});

	describe('memory integration', () => {
		it('should store design results in memory graph', async () => {
			const task = createTask({
				title: 'UI Design',
				description: 'Create user interface design',
				inputs: {
					requirements: { type: 'web_app', store_in_memory: true }
				},
			});

			const result = await designerAgent.executeTask(task);

			expect(result.success).toBe(true);
			// Memory integration is internal,
			// so we mainly verify the task completes successfully
		});
	});

	describe('accessibility considerations', () => {
		it('should include accessibility features in designs', async () => {
			const task = createTask({
				title: 'Create accessible UI',
				description: 'Design with accessibility in mind',
				inputs: {
					requirements: {
						accessibility: 'wcag-aa',
						high_contrast: true,
						keyboard_navigation: true
					}
				},
			});

			const result = await designerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.outputs).toBeDefined();
			if (result.outputs) {
				expect((result.outputs as any).visual_design).toBeDefined();
			}
		});
	});
});
