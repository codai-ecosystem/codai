/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { AgentMemoryRuntime } from '@codai/memory-graph';

/**
 * Example integration showing how AIDE agents could use the memory graph system
 */
export class AIDEMemoryIntegration {
	private runtime: AgentMemoryRuntime;

	constructor() {
		this.runtime = new AgentMemoryRuntime({
			name: 'AIDE Project',
			description: 'AI-powered development environment',
		});
	}

	/**
	 * Process user requirements and create memory graph nodes
	 */
	async processUserRequirements(requirements: string): Promise<void> {
		// Example: Parse user requirements and create appropriate nodes
		if (requirements.includes('login') || requirements.includes('authentication')) {
			await this.runtime.addIntent({
				type: 'create_feature',
				data: {
					name: 'User Authentication',
					description: 'Implement user authentication system',
					priority: 'high',
					requirements: [
						'User registration',
						'Login/logout functionality',
						'Password reset',
						'Email verification',
					],
				},
			});

			const [loginScreen] = await this.runtime.addIntent({
				type: 'create_screen',
				data: {
					name: 'Login Screen',
					screenType: 'page',
					route: '/login',
				},
			});

			const [userModel] = await this.runtime.addIntent({
				type: 'create_data_model',
				data: {
					name: 'User',
					modelType: 'entity',
					fields: [
						{ name: 'id', type: 'string', required: true, unique: true },
						{ name: 'email', type: 'string', required: true, unique: true },
						{ name: 'password', type: 'string', required: true },
						{ name: 'createdAt', type: 'Date', required: true },
					],
				},
			});

			const [authAPI] = await this.runtime.addIntent({
				type: 'create_api',
				data: {
					name: 'Authentication API',
					method: 'POST',
					path: '/api/auth/login',
				},
			});

			// Create relationships
			const featureNodes = await this.runtime.findNodesByType('feature');
			if (featureNodes.length > 0) {
				const authFeature = featureNodes.find(f => f.name === 'User Authentication');
				if (authFeature) {
					await this.runtime.addRelationship(authFeature.id, loginScreen.id, 'contains');
					await this.runtime.addRelationship(authFeature.id, authAPI.id, 'contains');
					await this.runtime.addRelationship(authAPI.id, userModel.id, 'uses');
				}
			}
		}
	}

	/**
	 * Get current project context for AI agents
	 */
	async getProjectContext(): Promise<ProjectContext> {
		const analysis = await this.runtime.analyzeGraph();
		const recentHistory = this.runtime.getRecentContext(5);

		return {
			totalNodes: analysis.totalNodes,
			totalRelationships: analysis.totalRelationships,
			nodeDistribution: analysis.nodeTypeDistribution,
			complexity: analysis.complexity,
			completeness: analysis.completeness,
			recentChanges: recentHistory,
			currentGraph: this.runtime.currentGraph,
		};
	}

	/**
	 * Generate code suggestions based on memory graph
	 */
	async generateCodeSuggestions(nodeId: string): Promise<CodeSuggestion[]> {
		const node = this.runtime.graph.getNode(nodeId);
		if (!node) {
			return [];
		}

		const suggestions: CodeSuggestion[] = [];

		switch (node.type) {
			case 'api':
				const apiNode = node as any; // Type assertion for demo
				suggestions.push({
					type: 'function',
					title: `Implement ${apiNode.name}`,
					description: `Create ${apiNode.method} endpoint for ${apiNode.path}`,
					code: this.generateAPICode(apiNode),
					priority: 'high',
				});
				break;

			case 'data_model':
				const modelNode = node as any;
				suggestions.push({
					type: 'class',
					title: `Create ${modelNode.name} Model`,
					description: `Define data model with fields and relationships`,
					code: this.generateModelCode(modelNode),
					priority: 'medium',
				});
				break;

			case 'screen':
				const screenNode = node as any;
				suggestions.push({
					type: 'component',
					title: `Create ${screenNode.name} Component`,
					description: `Build React component for ${screenNode.screenType}`,
					code: this.generateScreenCode(screenNode),
					priority: 'medium',
				});
				break;
		}

		return suggestions;
	}

	/**
	 * Track agent actions in memory graph
	 */
	async trackAgentAction(action: AgentAction): Promise<void> {
		await this.runtime.addConversationEntry({
			type: 'analysis',
			content: action,
			resultNodeIds: action.affectedNodeIds || [],
		});
	}
	// Helper methods for code generation
	private generateAPICode(apiNode: any): string {
		const serviceName = apiNode.name.toLowerCase().replace(/\s+/g, '');
		const handlerName = apiNode.name.replace(/\s+/g, '');

		// Generate appropriate implementation based on HTTP method
		const implementations = {
			GET: `const result = await ${serviceName}Service.findAll();`,
			POST: `const result = await ${serviceName}Service.create(req.body);`,
			PUT: `const result = await ${serviceName}Service.update(req.params.id, req.body);`,
			DELETE: `const result = await ${serviceName}Service.delete(req.params.id);`,
		};

		const implementation =
			implementations[apiNode.method as keyof typeof implementations] ||
			`const result = await ${serviceName}Service.process(req.body);`;

		return `
// ${apiNode.name} - ${apiNode.method} ${apiNode.path}
export async function handle${handlerName}(req: Request, res: Response) {
	try {
		// Validate request parameters
		if (!req.body || Object.keys(req.body).length === 0) {
			return res.status(400).json({ success: false, error: 'Request body is required' });
		}

		// Execute business logic
		${implementation}

		res.json({ success: true, data: result });
	} catch (error) {
		console.error('Error in ${handlerName}:', error);
		res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
	}
}`;
	}

	private generateModelCode(modelNode: any): string {
		const fields =
			modelNode.fields
				?.map((field: any) => `\t${field.name}${field.required ? '' : '?'}: ${field.type};`)
				.join('\n') || '';

		return `
// ${modelNode.name} Data Model
export interface ${modelNode.name} {
${fields}
}

export const ${modelNode.name}Schema = z.object({
${
	modelNode.fields
		?.map(
			(field: any) =>
				`\t${field.name}: z.${field.type.toLowerCase()}()${field.required ? '' : '.optional()'}`
		)
		.join(',\n') || ''
}
});`;
	}
	private generateScreenCode(screenNode: any): string {
		const componentName = screenNode.name.replace(/\s+/g, '');
		const className = screenNode.name.toLowerCase().replace(/\s+/g, '-');

		// Generate basic UI structure based on screen type
		const getScreenContent = () => {
			if (screenNode.name.toLowerCase().includes('login')) {
				return `
			<form className="login-form max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
				<h1 className="text-2xl font-bold mb-6 text-center">${screenNode.name}</h1>
				<div className="mb-4">
					<label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
					<input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
				<div className="mb-6">
					<label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
					<input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
				<button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors">
					Login
				</button>
			</form>`;
			} else if (screenNode.name.toLowerCase().includes('dashboard')) {
				return `
			<div className="dashboard-layout p-6">
				<h1 className="text-3xl font-bold mb-6">${screenNode.name}</h1>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					<div className="bg-white p-4 rounded-lg shadow-md">
						<h2 className="text-xl font-semibold mb-2">Overview</h2>
						<p className="text-gray-600">Dashboard overview content</p>
					</div>
					<div className="bg-white p-4 rounded-lg shadow-md">
						<h2 className="text-xl font-semibold mb-2">Statistics</h2>
						<p className="text-gray-600">Statistics content</p>
					</div>
					<div className="bg-white p-4 rounded-lg shadow-md">
						<h2 className="text-xl font-semibold mb-2">Recent Activity</h2>
						<p className="text-gray-600">Recent activity content</p>
					</div>
				</div>
			</div>`;
			} else {
				return `
			<div className="page-content p-6">
				<h1 className="text-2xl font-bold mb-4">${screenNode.name}</h1>
				<div className="content-area bg-white rounded-lg shadow-md p-6">
					<p className="text-gray-600">Content for ${screenNode.name} will be implemented here.</p>
					{/* Add your specific UI components here */}
				</div>
			</div>`;
			}
		};

		return `
// ${screenNode.name} React Component
import React, { useState, useEffect } from 'react';

interface ${componentName}Props {
	className?: string;
}

export const ${componentName}: React.FC<${componentName}Props> = ({ className }) => {
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		// Component initialization logic
		setLoading(false);
	}, []);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	return (
		<div className={\`${className} \${className || ''}\`}>${getScreenContent()}
		</div>
	);
};

export default ${componentName};`;
	}
}

// Types for integration
export interface ProjectContext {
	totalNodes: number;
	totalRelationships: number;
	nodeDistribution: Record<string, number>;
	complexity: number;
	completeness: number;
	recentChanges: any[];
	currentGraph: any;
}

export interface CodeSuggestion {
	type: 'function' | 'class' | 'component' | 'interface';
	title: string;
	description: string;
	code: string;
	priority: 'low' | 'medium' | 'high';
}

export interface AgentAction {
	type: string;
	description: string;
	timestamp: Date;
	affectedNodeIds?: string[];
	metadata?: Record<string, unknown>;
}
