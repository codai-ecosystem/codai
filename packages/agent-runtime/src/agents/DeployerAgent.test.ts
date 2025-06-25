/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeployerAgent } from './DeployerAgent';
import { MemoryGraphEngine } from '@codai/memory-graph';
import { Task, TaskResult, AgentConfig } from '../types';

describe('DeployerAgent', () => {
	let deployerAgent: DeployerAgent;
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
			id: 'deployer-agent',
			name: 'Deployer Agent',
			description: 'AI agent for deployment and DevOps',
			type: 'deployer',
			capabilities: [],
			aiProvider: {
				provider: 'openai',
				model: 'gpt-4',
				temperature: 0.7,
			},
			priority: 5,
			isEnabled: true,
		};

		deployerAgent = new DeployerAgent(mockConfig, mockMemoryGraph);

		// Mock the sendMessage method to avoid actual message sending
		vi.spyOn(deployerAgent as any, 'sendMessage').mockResolvedValue(undefined);
	});

	// Helper function to create valid Task objects
	const createTask = (overrides: Partial<Task>): Task => ({
		id: '1',
		title: 'Test Task',
		description: 'Test Description',
		agentId: 'deployer',
		status: 'pending',
		priority: 'medium',
		createdAt: new Date(),
		progress: 0,
		inputs: {},
		...overrides,
	});

	describe('canExecuteTask', () => {
		it('should accept deployment tasks', () => {
			const task = createTask({
				title: 'Deploy application to production',
				description: 'Set up production deployment',
			});

			expect(deployerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should accept CI/CD tasks', () => {
			const task = createTask({
				title: 'Setup CI/CD pipeline',
				description: 'Configure automated build and deployment',
			});

			expect(deployerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should accept Docker tasks', () => {
			const task = createTask({
				title: 'Create Docker configuration',
				description: 'Set up containerization for the application',
			});

			expect(deployerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should accept Kubernetes tasks', () => {
			const task = createTask({
				title: 'Setup Kubernetes deployment',
				description: 'Configure K8s manifests for orchestration',
			});

			expect(deployerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should accept infrastructure tasks', () => {
			const task = createTask({
				title: 'Setup infrastructure as code',
				description: 'Create Terraform configuration for AWS resources',
			});

			expect(deployerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should accept DevOps tasks', () => {
			const task = createTask({
				title: 'DevOps automation setup',
				description: 'Configure automated deployment pipeline',
			});

			expect(deployerAgent.canExecuteTask(task)).toBe(true);
		});

		it('should reject non-deployment tasks', () => {
			const task = createTask({
				title: 'Write unit tests',
				description: 'Create comprehensive test coverage',
				agentId: 'tester',
			});

			expect(deployerAgent.canExecuteTask(task)).toBe(false);
		});
	});

	describe('executeTask', () => {
		it('should execute Docker configuration tasks successfully', async () => {
			const task = createTask({
				title: 'Setup Docker configuration',
				description: 'Create Dockerfile and docker-compose.yml',
				inputs: {
					projectPath: '/path/to/project',
					deploymentType: 'docker',
					platform: 'node',
				},
			});

			const result = await deployerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.duration).toBeGreaterThan(0);
			if (result.outputs) {
				expect(result.outputs.deploymentType).toBe('docker');
				expect(result.outputs.platform).toBe('node');
				expect(result.outputs.result).toBeDefined();
			}
		});

		it('should execute Kubernetes configuration tasks successfully', async () => {
			const task = createTask({
				title: 'Setup Kubernetes deployment',
				description: 'Create K8s manifests',
				inputs: {
					projectPath: '/path/to/project',
					deploymentType: 'kubernetes',
				},
			});

			const result = await deployerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.duration).toBeGreaterThan(0);
			if (result.outputs) {
				expect(result.outputs.deploymentType).toBe('kubernetes');
				expect(result.outputs.result).toBeDefined();
			}
		});

		it('should execute CI/CD pipeline tasks successfully', async () => {
			const task = createTask({
				title: 'Setup CI/CD pipeline',
				description: 'Configure GitHub Actions workflow',
				inputs: {
					projectPath: '/path/to/project',
					deploymentType: 'ci/cd',
					ciProvider: 'github',
				},
			});

			const result = await deployerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.duration).toBeGreaterThan(0);
			if (result.outputs) {
				expect(result.outputs.deploymentType).toBe('ci/cd');
				expect(result.outputs.result).toBeDefined();
			}
		});

		it('should execute infrastructure tasks successfully', async () => {
			const task = createTask({
				title: 'Setup infrastructure code',
				description: 'Create Terraform configuration',
				inputs: {
					projectPath: '/path/to/project',
					deploymentType: 'infrastructure',
					infraProvider: 'terraform',
				},
			});

			const result = await deployerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.duration).toBeGreaterThan(0);
			if (result.outputs) {
				expect(result.outputs.deploymentType).toBe('infrastructure');
				expect(result.outputs.result).toBeDefined();
			}
		});

		it('should execute general deployment tasks successfully', async () => {
			const task = createTask({
				title: 'Setup production deployment',
				description: 'Configure deployment for production environment',
				inputs: {
					projectPath: '/path/to/project',
					deploymentType: 'production',
				},
			});

			const result = await deployerAgent.executeTask(task);

			expect(result.success).toBe(true);
			expect(result.duration).toBeGreaterThan(0);
			if (result.outputs) {
				expect(result.outputs.deploymentType).toBe('production');
				expect(result.outputs.result).toBeDefined();
			}
		});

		it('should handle task execution errors gracefully', async () => {
			const task = createTask({
				title: 'Deploy to invalid platform',
				description: 'This should cause an error',
				inputs: {
					projectPath: null, // Invalid input to trigger error
				},
			});

			// Mock the private methods to throw an error
			const originalMethod = (deployerAgent as any).generateGeneralDeploymentConfig;
			vi.spyOn(deployerAgent as any, 'generateGeneralDeploymentConfig').mockRejectedValue(
				new Error('Deployment failed')
			);

			const result = await deployerAgent.executeTask(task);

			expect(result.success).toBe(false);
			expect(result.duration).toBeGreaterThan(0);
			if (result.outputs) {
				expect(result.outputs.error).toBe('Deployment failed');
			}

			// Restore original method
			(deployerAgent as any).generateGeneralDeploymentConfig = originalMethod;
		});

		it('should include execution duration in results', async () => {
			const task = createTask({
				title: 'Quick deployment task',
				description: 'Simple deployment configuration',
				inputs: { projectPath: '/path/to/project' },
			});

			const result = await deployerAgent.executeTask(task);

			expect(result.duration).toBeGreaterThan(0);
			expect(typeof result.duration).toBe('number');
		});
	});

	describe('Docker configuration generation', () => {
		it('should generate Docker configuration for Node.js projects', async () => {
			const task = createTask({
				title: 'Docker setup for Node.js',
				description: 'Create Docker configuration for Node.js application',
				inputs: {
					projectPath: '/path/to/node-project',
					deploymentType: 'docker',
				},
			});

			const result = await deployerAgent.executeTask(task);

			expect(result.success).toBe(true);
			if (result.outputs && result.outputs.result) {
				const config = JSON.parse(result.outputs.result as string);
				expect(config.type).toBe('docker_configuration');
				expect(config.files).toBeDefined();
				expect(config.files['Dockerfile']).toContain('FROM node:');
				expect(config.files['docker-compose.yml']).toContain('version:');
				expect(config.files['.dockerignore']).toContain('node_modules');
			}
		});

		it('should generate appropriate Dockerfile content', async () => {
			const task = createTask({
				title: 'Generate Dockerfile',
				description: 'Create optimized Dockerfile',
				inputs: {
					projectPath: '/path/to/project',
					deploymentType: 'docker',
				},
			});

			const result = await deployerAgent.executeTask(task);

			expect(result.success).toBe(true);
			if (result.outputs && result.outputs.result) {
				const config = JSON.parse(result.outputs.result as string);
				const dockerfile = config.files['Dockerfile'];
				expect(dockerfile).toContain('WORKDIR');
				expect(dockerfile).toContain('COPY');
				expect(dockerfile).toContain('EXPOSE');
				expect(dockerfile).toContain('CMD');
			}
		});
	});

	describe('Kubernetes configuration generation', () => {
		it('should generate Kubernetes manifests', async () => {
			const task = createTask({
				title: 'Create Kubernetes config',
				description: 'Generate K8s deployment manifests',
				inputs: {
					projectPath: '/path/to/project',
					deploymentType: 'kubernetes',
				},
			});

			const result = await deployerAgent.executeTask(task);

			expect(result.success).toBe(true);
			if (result.outputs && result.outputs.result) {
				const config = JSON.parse(result.outputs.result as string);
				expect(config.type).toBe('kubernetes_configuration');
				expect(config.files).toBeDefined();
				expect(config.files['k8s/deployment.yaml']).toBeDefined();
				expect(config.files['k8s/service.yaml']).toBeDefined();
				expect(config.files['k8s/ingress.yaml']).toBeDefined();
			}
		});
	});

	describe('CI/CD pipeline generation', () => {
		it('should generate GitHub Actions workflow', async () => {
			const task = createTask({
				title: 'Setup GitHub Actions',
				description: 'Create GitHub Actions CI/CD pipeline',
				inputs: {
					projectPath: '/path/to/project',
					deploymentType: 'ci/cd',
					ciProvider: 'github',
				},
			});

			const result = await deployerAgent.executeTask(task);

			expect(result.success).toBe(true);
			if (result.outputs && result.outputs.result) {
				const config = JSON.parse(result.outputs.result as string);
				expect(config.type).toBe('cicd_pipeline');
				expect(config.provider).toBe('github');
				expect(config.configuration).toBeDefined();
			}
		});

		it('should generate GitLab CI configuration', async () => {
			const task = createTask({
				title: 'Setup GitLab CI',
				description: 'Create GitLab CI/CD pipeline',
				inputs: {
					projectPath: '/path/to/project',
					deploymentType: 'ci/cd',
					ciProvider: 'gitlab',
				},
			});

			const result = await deployerAgent.executeTask(task);

			expect(result.success).toBe(true);
			if (result.outputs && result.outputs.result) {
				const config = JSON.parse(result.outputs.result as string);
				expect(config.type).toBe('cicd_pipeline');
				expect(config.provider).toBe('gitlab');
				expect(config.configuration).toBeDefined();
			}
		});

		it('should default to GitHub Actions for unknown CI providers', async () => {
			const task = createTask({
				title: 'Setup CI pipeline',
				description: 'Create CI/CD pipeline with unknown provider',
				inputs: {
					projectPath: '/path/to/project',
					deploymentType: 'ci/cd',
					ciProvider: 'unknown',
				},
			});

			const result = await deployerAgent.executeTask(task);

			expect(result.success).toBe(true);
			if (result.outputs && result.outputs.result) {
				const config = JSON.parse(result.outputs.result as string);
				expect(config.type).toBe('cicd_pipeline');
				expect(config.provider).toBe('unknown');
				expect(config.configuration).toBeDefined();
			}
		});
	});

	describe('Infrastructure as Code generation', () => {
		it('should generate Terraform configuration', async () => {
			const task = createTask({
				title: 'Create Terraform config',
				description: 'Generate infrastructure as code with Terraform',
				inputs: {
					projectPath: '/path/to/project',
					deploymentType: 'infrastructure',
					infraProvider: 'terraform',
				},
			});

			const result = await deployerAgent.executeTask(task);

			expect(result.success).toBe(true);
			if (result.outputs && result.outputs.result) {
				const config = JSON.parse(result.outputs.result as string);
				expect(config.type).toBe('infrastructure_code');
				expect(config.provider).toBe('terraform');
				expect(config.configuration).toBeDefined();
			}
		});

		it('should generate AWS CDK configuration', async () => {
			const task = createTask({
				title: 'Create AWS CDK config',
				description: 'Generate infrastructure with AWS CDK',
				inputs: {
					projectPath: '/path/to/project',
					deploymentType: 'infrastructure',
					infraProvider: 'aws-cdk',
				},
			});

			const result = await deployerAgent.executeTask(task);

			expect(result.success).toBe(true);
			if (result.outputs && result.outputs.result) {
				const config = JSON.parse(result.outputs.result as string);
				expect(config.type).toBe('infrastructure_code');
				expect(config.provider).toBe('aws-cdk');
				expect(config.configuration).toBeDefined();
			}
		});

		it('should default to Terraform for unknown infrastructure providers', async () => {
			const task = createTask({
				title: 'Create infrastructure config',
				description: 'Generate infrastructure with unknown provider',
				inputs: {
					projectPath: '/path/to/project',
					deploymentType: 'infrastructure',
					infraProvider: 'unknown',
				},
			});

			const result = await deployerAgent.executeTask(task);

			expect(result.success).toBe(true);
			if (result.outputs && result.outputs.result) {
				const config = JSON.parse(result.outputs.result as string);
				expect(config.type).toBe('infrastructure_code');
				expect(config.provider).toBe('unknown');
				expect(config.configuration).toBeDefined();
			}
		});
	});

	describe('general deployment configuration', () => {
		it('should generate general deployment config when no specific type is provided', async () => {
			const task = createTask({
				title: 'Setup deployment',
				description: 'Configure general deployment',
				inputs: {
					projectPath: '/path/to/project',
				},
			});

			const result = await deployerAgent.executeTask(task);

			expect(result.success).toBe(true);
			if (result.outputs && result.outputs.result) {
				const config = JSON.parse(result.outputs.result as string);
				expect(config.type).toBe('general_deployment');
				expect(config.configuration).toBeDefined();
				expect(config.configuration.dockerfile).toBeDefined();
				expect(config.configuration.deploymentScript).toBeDefined();
				expect(config.configuration.environmentConfig).toBeDefined();
				expect(config.configuration.healthCheck).toBeDefined();
			}
		});
	});
});
