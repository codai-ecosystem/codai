import * as vscode from 'vscode';
import { IMemoryGraph } from '../interfaces/IMemoryGraph';
import { PlannerAgent } from './plannerAgent';
import { BuilderAgent } from './builderAgent';
import { DesignerAgent } from './designerAgent';
import { TestAgent } from './testAgent';
import { DeployAgent } from './deployAgent';
import { CodeAgent } from './codeAgent';
import { AIService } from '../services/aiService';

export interface AgentResponse {
	agent: string;
	message: string;
	actions?: AgentAction[];
	metadata?: Record<string, any>;
}

export interface AgentAction {
	type: 'createFile' | 'modifyFile' | 'deleteFile' | 'runCommand' | 'showPreview';
	target: string;
	content?: string;
	command?: string;
	description?: string;
}

export class AgentManager {
	private memoryGraph: IMemoryGraph;
	private aiService: AIService;
	private plannerAgent: PlannerAgent;
	private builderAgent: BuilderAgent;
	private designerAgent: DesignerAgent;
	private testAgent: TestAgent;
	private deployAgent: DeployAgent;
	private codeAgent: CodeAgent;
	private outputChannel: vscode.OutputChannel;

	constructor(memoryGraph: IMemoryGraph, aiService: AIService) {
		this.memoryGraph = memoryGraph;
		this.aiService = aiService;
		this.outputChannel = vscode.window.createOutputChannel('AIDE Agents');

		// Initialize agents
		this.plannerAgent = new PlannerAgent(memoryGraph, aiService);
		this.builderAgent = new BuilderAgent(memoryGraph, aiService);
		this.designerAgent = new DesignerAgent(memoryGraph, aiService);
		this.testAgent = new TestAgent(memoryGraph, aiService);
		this.deployAgent = new DeployAgent(memoryGraph, aiService);
		this.codeAgent = new CodeAgent(memoryGraph, aiService);
	}

	/**
	 * Process a user message and route to appropriate agents
	 */
	async processMessage(message: string, context?: Record<string, any>): Promise<AgentResponse[]> {
		this.log(`Processing message: ${message}`);

		// Add user intent to memory graph
		const intentId = this.memoryGraph.addNode('intent', message, {
			source: 'user',
			timestamp: new Date().toISOString(),
			context
		});

		const responses: AgentResponse[] = [];

		// Determine which agents should handle this message
		const agents = this.determineRelevantAgents(message);

		for (const agentType of agents) {
			try {
				let response: AgentResponse; switch (agentType) {
					case 'planner':
						response = await this.plannerAgent.process(message, intentId);
						break;
					case 'builder':
						response = await this.builderAgent.process(message, intentId);
						break;
					case 'designer':
						response = await this.designerAgent.process(message, intentId);
						break;
					case 'test':
						response = await this.testAgent.process(message, intentId);
						break;
					case 'deploy':
						response = await this.deployAgent.process(message, intentId);
						break;
					case 'code':
						response = await this.codeAgent.process(message, intentId);
						break;
					default:
						continue;
				}

				responses.push(response);
				this.log(`${agentType} agent response: ${response.message}`);

			} catch (error) {
				this.log(`Error from ${agentType} agent: ${error}`);
				responses.push({
					agent: agentType,
					message: `Error processing request: ${error}`,
					metadata: { error: true }
				});
			}
		}

		return responses;
	}

	/**
	 * Plan a new feature
	 */
	async planFeature(featureDescription: string): Promise<AgentResponse> {
		this.log(`Planning feature: ${featureDescription}`);

		const intentId = this.memoryGraph.addNode('intent', `Plan feature: ${featureDescription}`, {
			type: 'feature_planning',
			timestamp: new Date().toISOString()
		});

		return await this.plannerAgent.process(featureDescription, intentId);
	}

	/**
	 * Build the current project
	 */
	async buildProject(): Promise<AgentResponse> {
		this.log('Building project');

		const intentId = this.memoryGraph.addNode('intent', 'Build project', {
			type: 'build',
			timestamp: new Date().toISOString()
		});

		return await this.builderAgent.process('Build the current project', intentId);
	}

	/**
	 * Deploy the current project
	 */
	async deployProject(): Promise<AgentResponse> {
		this.log('Deploying project');

		const intentId = this.memoryGraph.addNode('intent', 'Deploy project', {
			type: 'deployment',
			timestamp: new Date().toISOString()
		});

		return await this.deployAgent.process('Deploy the current project', intentId);
	}

	/**
	 * Get project status from all agents
	 */
	async getProjectStatus(): Promise<Record<string, any>> {
		const status = {
			planner: await this.plannerAgent.getStatus(),
			builder: await this.builderAgent.getStatus(),
			designer: await this.designerAgent.getStatus(),
			test: await this.testAgent.getStatus(),
			deploy: await this.deployAgent.getStatus(),
			code: await this.codeAgent.getStatus()
		};

		return status;
	}

	/**
	 * Execute agent actions
	 */
	async executeActions(actions: AgentAction[]): Promise<void> {
		for (const action of actions) {
			try {
				await this.executeAction(action);
			} catch (error) {
				this.log(`Error executing action ${action.type}: ${error}`);
				vscode.window.showErrorMessage(`Failed to execute ${action.type}: ${error}`);
			}
		}
	}

	/**
	 * Determine which agents are relevant for a given message
	 */
	private determineRelevantAgents(message: string): string[] {
		const lowercaseMessage = message.toLowerCase();
		const agents: string[] = [];
		// Keywords that trigger specific agents
		const keywords = {
			planner: ['plan', 'design', 'architecture', 'feature', 'requirement', 'spec'],
			builder: ['build', 'code', 'implement', 'create', 'develop', 'function', 'class'],
			designer: ['ui', 'ux', 'interface', 'design', 'layout', 'style', 'component'],
			test: ['test', 'testing', 'spec', 'unit', 'integration', 'coverage'],
			deploy: ['deploy', 'deployment', 'publish', 'release', 'production'],
			code: ['complete', 'completion', 'suggest', 'autocomplete', 'intellisense', 'snippet']
		};

		for (const [agent, agentKeywords] of Object.entries(keywords)) {
			if (agentKeywords.some(keyword => lowercaseMessage.includes(keyword))) {
				agents.push(agent);
			}
		}

		// If no specific agents were triggered, use planner as default
		if (agents.length === 0) {
			agents.push('planner');
		}

		return agents;
	}

	/**
	 * Execute a single action
	 */
	private async executeAction(action: AgentAction): Promise<void> {
		switch (action.type) {
			case 'createFile':
				if (action.content) {
					const uri = vscode.Uri.file(action.target);
					await vscode.workspace.fs.writeFile(uri, Buffer.from(action.content, 'utf8'));
					this.log(`Created file: ${action.target}`);
				}
				break;

			case 'modifyFile':
				if (action.content) {
					const uri = vscode.Uri.file(action.target);
					await vscode.workspace.fs.writeFile(uri, Buffer.from(action.content, 'utf8'));
					this.log(`Modified file: ${action.target}`);
				}
				break;

			case 'deleteFile':
				const uri = vscode.Uri.file(action.target);
				await vscode.workspace.fs.delete(uri);
				this.log(`Deleted file: ${action.target}`);
				break;

			case 'runCommand':
				if (action.command) {
					const terminal = vscode.window.createTerminal('AIDE Command');
					terminal.sendText(action.command);
					terminal.show();
					this.log(`Ran command: ${action.command}`);
				}
				break;

			case 'showPreview':
				// This would show a preview of the action.target (could be a URL or file)
				if (action.target.startsWith('http')) {
					vscode.env.openExternal(vscode.Uri.parse(action.target));
				} else {
					const document = await vscode.workspace.openTextDocument(action.target);
					await vscode.window.showTextDocument(document);
				}
				this.log(`Showed preview: ${action.target}`);
				break;
		}
	}

	/**
	 * Log message to output channel
	 */
	private log(message: string): void {
		this.outputChannel.appendLine(`[${new Date().toISOString()}] ${message}`);
	}

	/**
	 * Dispose resources
	 */
	dispose(): void {
		this.outputChannel.dispose();
	}
}
