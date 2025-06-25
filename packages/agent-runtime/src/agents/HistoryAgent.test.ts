/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HistoryAgent } from './HistoryAgent';
import { MemoryGraphEngine } from '@codai/memory-graph';
import { Task, TaskResult, AgentConfig } from '../types';

describe('HistoryAgent', () => {
	let historyAgent: HistoryAgent;
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
			id: 'history-agent',
			name: 'History Agent',
			description: 'AI agent for project history and version control',
			type: 'history',
			capabilities: [],
			aiProvider: {
				provider: 'openai',
				model: 'gpt-4',
				temperature: 0.7,
			},
			priority: 5,
			isEnabled: true,
		};

		historyAgent = new HistoryAgent(mockConfig, mockMemoryGraph);

		// Mock the sendMessage method to avoid actual message sending
		vi.spyOn(historyAgent as any, 'sendMessage').mockResolvedValue(undefined);
	});

	// Helper function to create valid Task objects
	const createTask = (overrides: Partial<Task>): Task => ({
		id: '1',
		title: 'Test Task',
		description: 'Test Description',
		agentId: 'history',
		status: 'pending',
		priority: 'medium',
		createdAt: new Date(),
		progress: 0,
		inputs: {},
		...overrides,
	});

	describe('canExecuteTask', () => {
		it('should accept history tasks', () => {
			const task = createTask({
				title: 'Analyze project history',
				description: 'Review development timeline and patterns',
			});

			expect(historyAgent.canExecuteTask(task)).toBe(true);
		});

		it('should accept version control tasks', () => {
			const task = createTask({
				title: 'Generate version changelog',
				description: 'Create changelog from git history',
			});

			expect(historyAgent.canExecuteTask(task)).toBe(true);
		});

		it('should accept changelog tasks', () => {
			const task = createTask({
				title: 'Create changelog for release',
				description: 'Generate comprehensive changelog documentation',
			});

			expect(historyAgent.canExecuteTask(task)).toBe(true);
		});

		it('should accept commit analysis tasks', () => {
			const task = createTask({
				title: 'Analyze commit patterns',
				description: 'Study commit history and development patterns',
			});

			expect(historyAgent.canExecuteTask(task)).toBe(true);
		});

		it('should accept timeline tasks', () => {
			const task = createTask({
				title: 'Generate project timeline',
				description: 'Create visual timeline of project evolution',
			});

			expect(historyAgent.canExecuteTask(task)).toBe(true);
		});

		it('should accept diff analysis tasks', () => {
			const task = createTask({
				title: 'Analyze code differences',
				description: 'Compare changes between versions',
			});

			expect(historyAgent.canExecuteTask(task)).toBe(true);
		});

		it('should accept audit tasks', () => {
			const task = createTask({
				title: 'Perform audit trail analysis',
				description: 'Review project changes for compliance',
			});

			expect(historyAgent.canExecuteTask(task)).toBe(true);
		});

		it('should accept release tasks', () => {
			const task = createTask({
				title: 'Create release notes',
				description: 'Generate release documentation',
			});

			expect(historyAgent.canExecuteTask(task)).toBe(true);
		});

		it('should reject non-history tasks', () => {
			const task = createTask({
				title: 'Deploy application',
				description: 'Setup production deployment',
				agentId: 'deployer',
			});

			expect(historyAgent.canExecuteTask(task)).toBe(false);
		});
	});

	describe('executeTask', () => {
		it('should execute changelog generation tasks successfully', async () => {
			const task = createTask({
				title: 'Generate changelog',
				description: 'Create project changelog from git history',
				inputs: {
					projectPath: '/path/to/project',
					historyType: 'changelog',
				},
			});

			const result = await historyAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.duration).toBeGreaterThan(0);
			if (result.outputs && result.outputs.result) {
				const changelogData = JSON.parse(result.outputs.result as string);
				expect(changelogData.type).toBe('changelog');
				expect(changelogData.content).toBeDefined();
				expect(changelogData.format).toBe('markdown');
			}
		});

		it('should execute commit analysis tasks successfully', async () => {
			const task = createTask({
				title: 'Analyze commit history',
				description: 'Study development patterns from commits',
				inputs: {
					projectPath: '/path/to/project',
					historyType: 'commit',
				},
			});

			const result = await historyAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.duration).toBeGreaterThan(0);
			if (result.outputs && result.outputs.result) {
				const analysisData = JSON.parse(result.outputs.result as string);
				expect(analysisData.type).toBe('commit_analysis');
				expect(analysisData.summary).toBeDefined();
				expect(analysisData.patterns).toBeDefined();
				expect(analysisData.statistics).toBeDefined();
			}
		});

		it('should execute release notes creation tasks successfully', async () => {
			const task = createTask({
				title: 'Create release notes',
				description: 'Generate release documentation',
				inputs: {
					projectPath: '/path/to/project',
					historyType: 'release',
					version: 'v1.2.0',
					previousVersion: 'v1.1.0',
				},
			});

			const result = await historyAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.duration).toBeGreaterThan(0);
			if (result.outputs && result.outputs.result) {
				const releaseData = JSON.parse(result.outputs.result as string);
				expect(releaseData.type).toBe('release_notes');
				expect(releaseData.version).toBe('v1.2.0');
				expect(releaseData.content).toBeDefined();
				expect(releaseData.format).toBe('markdown');
			}
		});

		it('should execute timeline generation tasks successfully', async () => {
			const task = createTask({
				title: 'Generate project timeline',
				description: 'Create visual project evolution timeline',
				inputs: {
					projectPath: '/path/to/project',
					historyType: 'timeline',
				},
			});

			const result = await historyAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.duration).toBeGreaterThan(0);
			if (result.outputs && result.outputs.result) {
				const timelineData = JSON.parse(result.outputs.result as string);
				expect(timelineData.type).toBe('project_timeline');
				expect(timelineData.timeline).toBeDefined();
				expect(timelineData.totalEvents).toBeGreaterThanOrEqual(0);
			}
		});

		it('should execute diff analysis tasks successfully', async () => {
			const task = createTask({
				title: 'Analyze differences',
				description: 'Compare changes between versions',
				inputs: {
					projectPath: '/path/to/project',
					historyType: 'diff',
					source: 'v1.0.0',
					target: 'v1.1.0',
				},
			});

			const result = await historyAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.duration).toBeGreaterThan(0);
			if (result.outputs && result.outputs.result) {
				const diffData = JSON.parse(result.outputs.result as string);
				expect(diffData.type).toBe('diff_analysis');
				expect(diffData.source).toBe('v1.0.0');
				expect(diffData.target).toBe('v1.1.0');
				expect(diffData.changes).toBeDefined();
			}
		});

		it('should execute audit trail tasks successfully', async () => {
			const task = createTask({
				title: 'Perform audit trail',
				description: 'Generate compliance audit report',
				inputs: {
					projectPath: '/path/to/project',
					historyType: 'audit',
				},
			});

			const result = await historyAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.duration).toBeGreaterThan(0);
			if (result.outputs && result.outputs.result) {
				const auditData = JSON.parse(result.outputs.result as string);
				expect(auditData.type).toBe('audit_trail');
				expect(auditData.auditReport).toBeDefined();
			}
		});

		it('should execute general history analysis tasks successfully', async () => {
			const task = createTask({
				title: 'Analyze project history',
				description: 'General project history analysis',
				inputs: {
					projectPath: '/path/to/project',
				},
			});

			const result = await historyAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.duration).toBeGreaterThan(0);
			if (result.outputs && result.outputs.result) {
				const historyData = JSON.parse(result.outputs.result as string);
				expect(historyData.type).toBe('project_history');
				expect(historyData.analysis).toBeDefined();
			}
		});

		it('should handle task execution errors gracefully', async () => {
			const task = createTask({
				title: 'Invalid history task',
				description: 'This should cause an error',
				inputs: {
					projectPath: null, // Invalid input to trigger error
				},
			});

			// Mock the private methods to throw an error
			vi.spyOn(historyAgent as any, 'analyzeProjectHistory').mockRejectedValue(
				new Error('History analysis failed')
			);

			const result = await historyAgent.executeTask(task);

			expect(result.success).toBe(false);
			expect(result.duration).toBeGreaterThan(0);
			if (result.outputs) {
				expect(result.outputs.error).toBe('History analysis failed');
			}
		});

		it('should include execution duration in results', async () => {
			const task = createTask({
				title: 'Quick history task',
				description: 'Simple history analysis',
				inputs: { projectPath: '/path/to/project' },
			});

			const result = await historyAgent.executeTask(task);

			expect(result.duration).toBeGreaterThan(0);
			expect(typeof result.duration).toBe('number');
		});
	});

	describe('changelog generation', () => {
		it('should format changelog with proper structure', async () => {
			const task = createTask({
				title: 'Generate formatted changelog',
				description: 'Create structured changelog from commits',
				inputs: {
					projectPath: '/path/to/project',
					historyType: 'changelog',
				},
			});

			const result = await historyAgent.executeTask(task);

			expect(result.success).toBe(true);
			if (result.outputs && result.outputs.result) {
				const changelogData = JSON.parse(result.outputs.result as string);
				expect(changelogData.type).toBe('changelog');
				expect(changelogData.content).toBeDefined();
				expect(changelogData.format).toBe('markdown');
				expect(changelogData.commits).toBeGreaterThanOrEqual(0);
				expect(changelogData.releases).toBeGreaterThanOrEqual(0);
				expect(changelogData.instructions).toContain('Changelog generated');
			}
		});
	});

	describe('commit analysis', () => {
		it('should provide comprehensive commit statistics', async () => {
			const task = createTask({
				title: 'Detailed commit analysis',
				description: 'Analyze commit patterns and statistics',
				inputs: {
					projectPath: '/path/to/project',
					historyType: 'commit',
				},
			});

			const result = await historyAgent.executeTask(task);

			expect(result.success).toBe(true);
			if (result.outputs && result.outputs.result) {
				const analysisData = JSON.parse(result.outputs.result as string);
				expect(analysisData.type).toBe('commit_analysis');
				expect(analysisData.summary).toBeDefined();
				expect(analysisData.patterns).toBeDefined();
				expect(analysisData.statistics).toBeDefined();
				expect(analysisData.recommendations).toBeDefined();
				expect(analysisData.instructions).toContain('analysis completed');
			}
		});
	});

	describe('release notes creation', () => {
		it('should generate release notes with version information', async () => {
			const task = createTask({
				title: 'Create v2.0.0 release notes',
				description: 'Generate comprehensive release documentation',
				inputs: {
					projectPath: '/path/to/project',
					historyType: 'release',
					version: 'v2.0.0',
					previousVersion: 'v1.9.0',
				},
			});

			const result = await historyAgent.executeTask(task);

			expect(result.success).toBe(true);
			if (result.outputs && result.outputs.result) {
				const releaseData = JSON.parse(result.outputs.result as string);
				expect(releaseData.type).toBe('release_notes');
				expect(releaseData.version).toBe('v2.0.0');
				expect(releaseData.content).toBeDefined();
				expect(releaseData.changes).toBeGreaterThanOrEqual(0);
				expect(releaseData.format).toBe('markdown');
				expect(releaseData.instructions).toContain('Release notes generated');
			}
		});

		it('should handle latest version when no specific version provided', async () => {
			const task = createTask({
				title: 'Create latest release notes',
				description: 'Generate release notes for current version',
				inputs: {
					projectPath: '/path/to/project',
					historyType: 'release',
				},
			});

			const result = await historyAgent.executeTask(task);

			expect(result.success).toBe(true);
			if (result.outputs && result.outputs.result) {
				const releaseData = JSON.parse(result.outputs.result as string);
				expect(releaseData.type).toBe('release_notes');
				expect(releaseData.version).toBe('latest');
			}
		});
	});

	describe('timeline generation', () => {
		it('should create comprehensive project timeline', async () => {
			const task = createTask({
				title: 'Create project timeline',
				description: 'Generate visual project development timeline',
				inputs: {
					projectPath: '/path/to/project',
					historyType: 'timeline',
				},
			});

			const result = await historyAgent.executeTask(task);

			expect(result.success).toBe(true);
			if (result.outputs && result.outputs.result) {
				const timelineData = JSON.parse(result.outputs.result as string);
				expect(timelineData.type).toBe('project_timeline');
				expect(timelineData.timeline).toBeDefined();
				expect(timelineData.totalEvents).toBeGreaterThanOrEqual(0);
				expect(timelineData.timespan).toBeDefined();
				expect(timelineData.instructions).toContain('timeline generated');
			}
		});
	});

	describe('diff analysis', () => {
		it('should analyze differences with default values', async () => {
			const task = createTask({
				title: 'Analyze recent changes',
				description: 'Compare recent commits',
				inputs: {
					projectPath: '/path/to/project',
					historyType: 'diff',
				},
			});

			const result = await historyAgent.executeTask(task);

			expect(result.success).toBe(true);
			if (result.outputs && result.outputs.result) {
				const diffData = JSON.parse(result.outputs.result as string);
				expect(diffData.type).toBe('diff_analysis');
				expect(diffData.source).toBe('HEAD~1'); // Default source
				expect(diffData.target).toBe('HEAD'); // Default target
				expect(diffData.changes).toBeDefined();
				expect(diffData.statistics).toBeDefined();
				expect(diffData.impact).toBeDefined();
			}
		});

		it('should analyze differences between specific versions', async () => {
			const task = createTask({
				title: 'Compare versions',
				description: 'Analyze changes between specific versions',
				inputs: {
					projectPath: '/path/to/project',
					historyType: 'diff',
					source: 'v1.0.0',
					target: 'v2.0.0',
				},
			});

			const result = await historyAgent.executeTask(task);

			expect(result.success).toBe(true);
			if (result.outputs && result.outputs.result) {
				const diffData = JSON.parse(result.outputs.result as string);
				expect(diffData.type).toBe('diff_analysis');
				expect(diffData.source).toBe('v1.0.0');
				expect(diffData.target).toBe('v2.0.0');
				expect(diffData.instructions).toContain('analysis completed');
			}
		});
	});

	describe('audit trail', () => {
		it('should generate comprehensive audit report', async () => {
			const task = createTask({
				title: 'Generate audit trail',
				description: 'Create compliance audit report',
				inputs: {
					projectPath: '/path/to/project',
					historyType: 'audit',
				},
			});

			const result = await historyAgent.executeTask(task);

			expect(result.success).toBe(true);
			if (result.outputs && result.outputs.result) {
				const auditData = JSON.parse(result.outputs.result as string);
				expect(auditData.type).toBe('audit_trail');
				expect(auditData.auditReport).toBeDefined();
				expect(auditData.instructions).toContain('audit trail generated');
			}
		});
	});

	describe('project history analysis', () => {
		it('should provide general project history insights', async () => {
			const task = createTask({
				title: 'Analyze project evolution',
				description: 'Study overall project development history',
				inputs: {
					projectPath: '/path/to/project',
					historyType: 'general',
				},
			});

			const result = await historyAgent.executeTask(task);

			expect(result.success).toBe(true);
			if (result.outputs && result.outputs.result) {
				const historyData = JSON.parse(result.outputs.result as string);
				expect(historyData.type).toBe('project_history');
				expect(historyData.analysis).toBeDefined();
				expect(historyData.insights).toBeDefined();
				expect(historyData.patterns).toBeDefined();
				expect(historyData.recommendations).toBeDefined();
			}
		});
	});
});
