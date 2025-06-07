/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import React from 'react';
import { createRoot } from 'react-dom/client';
import {
	MemoryGraphEngine,
	GraphBuilders,
	type IntentNode,
	type FeatureNode,
	type ScreenNode,
	type LogicNode,
	type DataNode,
	type Relationship
} from '@codai/memory-graph';
import { MemoryGraphVisualization } from '@codai/ui-components';

/**
 * Comprehensive demo showcasing AIDE's memory graph capabilities
 * This demonstrates how AIDE transforms traditional development workflow
 * into an intent-driven, graph-based approach
 */

const DEMO_STYLE = `
	body {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
		background: #0f0f23;
		color: #cccccc;
	}
	.demo-container {
		height: 100vh;
		display: flex;
		flex-direction: column;
	}
	.demo-header {
		padding: 1rem 2rem;
		background: linear-gradient(90deg, #1e1e3f, #2d2d5f);
		border-bottom: 2px solid #007acc;
	}
	.demo-title {
		margin: 0;
		color: #007acc;
		font-size: 1.5rem;
		font-weight: 600;
	}
	.demo-subtitle {
		margin: 0.5rem 0 0 0;
		color: #cccccc;
		font-size: 0.9rem;
		opacity: 0.8;
	}
	.demo-content {
		flex: 1;
		position: relative;
	}
	.demo-controls {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: rgba(15, 15, 35, 0.9);
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid #007acc;
		backdrop-filter: blur(8px);
		z-index: 1000;
	}
	.demo-button {
		background: #007acc;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		margin: 0.25rem;
		font-size: 0.9rem;
		transition: background 0.2s;
	}
	.demo-button:hover {
		background: #005999;
	}
	.demo-info {
		position: absolute;
		bottom: 1rem;
		left: 1rem;
		background: rgba(15, 15, 35, 0.9);
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid #007acc;
		backdrop-filter: blur(8px);
		max-width: 300px;
		z-index: 1000;
	}
	.demo-info h4 {
		margin: 0 0 0.5rem 0;
		color: #007acc;
	}
	.demo-info p {
		margin: 0;
		font-size: 0.8rem;
		line-height: 1.4;
	}
`;

class AIDEMemoryDemo {
	private engine: MemoryGraphEngine;
	private container: HTMLElement | null = null;

	constructor() {
		this.engine = new MemoryGraphEngine();
		this.setupInitialGraph();
	}

	/**
	 * Create an initial graph demonstrating AIDE's approach to software development
	 */	private setupInitialGraph(): void {
		// User intent: Build a task management app
		const mainIntent = this.engine.addNode(GraphBuilders.intent('Task Management App')
			.withDescription('Build a modern, collaborative task management application')
			.withMetadata({
				category: 'goal',
				priority: 'high',
				status: 'active',
				context: 'User wants to replace current inefficient task tracking with AI-enhanced solution',
			}).build());

		// Break down into features
		const authFeature = this.builder.addFeature({
			name: 'User Authentication',
			description: 'Secure user registration and login system',
			status: 'implemented',
			priority: 'critical',
			requirements: [
				'Email/password registration',
				'Social login (Google, GitHub)',
				'Password reset functionality',
				'Email verification'
			],
			acceptanceCriteria: [
				'Users can register with email',
				'Users can login securely',
				'Password reset works via email',
				'Social login integrates properly'
			],
			estimatedComplexity: 7,
		});

		const taskFeature = this.builder.addFeature({
			name: 'Task Management',
			description: 'Core task creation, editing, and organization features',
			status: 'in_progress',
			priority: 'high',
			requirements: [
				'Create/edit/delete tasks',
				'Task priorities and due dates',
				'Task categorization',
				'Subtasks and dependencies'
			],
			acceptanceCriteria: [
				'Users can CRUD tasks',
				'Tasks have priorities and dates',
				'Tasks can be categorized',
				'Complex task hierarchies supported'
			],
			estimatedComplexity: 8,
		});

		const aiFeature = this.builder.addFeature({
			name: 'AI Assistant',
			description: 'Intelligent task suggestions and automation',
			status: 'planned',
			priority: 'medium',
			requirements: [
				'Smart task suggestions',
				'Priority recommendations',
				'Deadline predictions',
				'Context-aware reminders'
			],
			estimatedComplexity: 9,
		});

		// UI Screens
		const loginScreen = this.builder.addScreen({
			name: 'Login Screen',
			description: 'User authentication interface',
			screenType: 'page',
			route: '/login',
			accessibilityLevel: 'AA',
		});

		const dashboardScreen = this.builder.addScreen({
			name: 'Task Dashboard',
			description: 'Main task overview and management interface',
			screenType: 'page',
			route: '/dashboard',
			accessibilityLevel: 'AA',
		});

		const taskModal = this.builder.addScreen({
			name: 'Task Editor',
			description: 'Modal for creating and editing tasks',
			screenType: 'modal',
			accessibilityLevel: 'AA',
		});

		// Business Logic
		const authService = this.builder.addLogic({
			name: 'Authentication Service',
			description: 'Handles user authentication and session management',
			logicType: 'service',
			inputs: [
				{ name: 'credentials', type: 'UserCredentials', required: true, description: 'User login credentials' },
				{ name: 'provider', type: 'AuthProvider', required: false, description: 'Social auth provider' }
			],
			outputs: [
				{ name: 'user', type: 'User', description: 'Authenticated user object' },
				{ name: 'token', type: 'string', description: 'JWT authentication token' }
			],
			complexity: 6,
			testCoverage: 85,
		});

		const taskService = this.builder.addLogic({
			name: 'Task Service',
			description: 'Core task management business logic',
			logicType: 'service',
			inputs: [
				{ name: 'taskData', type: 'TaskInput', required: true },
				{ name: 'userId', type: 'string', required: true }
			],
			outputs: [
				{ name: 'task', type: 'Task', description: 'Created or updated task' }
			],
			complexity: 7,
			testCoverage: 92,
		});

		const aiEngine = this.builder.addLogic({
			name: 'AI Recommendation Engine',
			description: 'Machine learning service for task intelligence',
			logicType: 'service',
			inputs: [
				{ name: 'userHistory', type: 'TaskHistory[]', required: true },
				{ name: 'context', type: 'UserContext', required: true }
			],
			outputs: [
				{ name: 'suggestions', type: 'TaskSuggestion[]', description: 'AI-generated task suggestions' },
				{ name: 'priorities', type: 'PriorityRecommendation[]', description: 'Priority recommendations' }
			],
			complexity: 9,
			testCoverage: 78,
		});

		// Data Models
		const userModel = this.builder.addData({
			name: 'User Model',
			description: 'User account and profile data structure',
			dataType: 'model',
			structure: {
				id: 'string',
				email: 'string',
				displayName: 'string',
				avatar: 'string?',
				preferences: 'UserPreferences',
				createdAt: 'Date',
				lastLoginAt: 'Date?'
			},
			validation: ['email format', 'unique email', 'display name length'],
			persistence: true,
		});

		const taskModel = this.builder.addData({
			name: 'Task Model',
			description: 'Task data structure with metadata',
			dataType: 'model',
			structure: {
				id: 'string',
				title: 'string',
				description: 'string?',
				priority: 'TaskPriority',
				status: 'TaskStatus',
				dueDate: 'Date?',
				assigneeId: 'string',
				tags: 'string[]',
				subtasks: 'Task[]',
				dependencies: 'string[]',
				aiMetadata: 'AIMetadata?'
			},
			validation: ['title required', 'priority enum', 'valid assignee'],
			persistence: true,
		});

		// Create relationships to show the graph structure
		this.builder.addRelationship(mainIntent.id, authFeature.id, 'contains');
		this.builder.addRelationship(mainIntent.id, taskFeature.id, 'contains');
		this.builder.addRelationship(mainIntent.id, aiFeature.id, 'contains');

		this.builder.addRelationship(authFeature.id, loginScreen.id, 'implements');
		this.builder.addRelationship(authFeature.id, authService.id, 'implements');
		this.builder.addRelationship(authFeature.id, userModel.id, 'uses');

		this.builder.addRelationship(taskFeature.id, dashboardScreen.id, 'implements');
		this.builder.addRelationship(taskFeature.id, taskModal.id, 'implements');
		this.builder.addRelationship(taskFeature.id, taskService.id, 'implements');
		this.builder.addRelationship(taskFeature.id, taskModel.id, 'uses');

		this.builder.addRelationship(aiFeature.id, aiEngine.id, 'implements');
		this.builder.addRelationship(aiEngine.id, taskModel.id, 'uses');
		this.builder.addRelationship(aiEngine.id, userModel.id, 'uses');

		this.builder.addRelationship(loginScreen.id, authService.id, 'uses');
		this.builder.addRelationship(dashboardScreen.id, taskService.id, 'uses');
		this.builder.addRelationship(taskModal.id, taskService.id, 'uses');

		this.builder.addRelationship(authService.id, userModel.id, 'uses');
		this.builder.addRelationship(taskService.id, taskModel.id, 'uses');

		this.builder.addRelationship(taskFeature.id, authFeature.id, 'depends_on');
		this.builder.addRelationship(aiFeature.id, taskFeature.id, 'depends_on');
	}

	/**
	 * Add a new feature to demonstrate real-time graph updates
	 */
	private addCollaborationFeature(): void {
		const collabFeature = this.builder.addFeature({
			name: 'Real-time Collaboration',
			description: 'Multi-user collaboration with live updates',
			status: 'planned',
			priority: 'medium',
			requirements: [
				'Real-time task updates',
				'User presence indicators',
				'Collaborative editing',
				'Comment system'
			],
			estimatedComplexity: 8,
		});

		const collabScreen = this.builder.addScreen({
			name: 'Collaboration Panel',
			description: 'Real-time collaboration interface',
			screenType: 'component',
			accessibilityLevel: 'AA',
		});

		const socketService = this.builder.addLogic({
			name: 'WebSocket Service',
			description: 'Real-time communication service',
			logicType: 'service',
			complexity: 7,
			testCoverage: 80,
		});

		// Connect to existing graph
		const mainIntent = this.builder.getNodesByType('intent')[0];
		const taskFeature = this.builder.getNodesByType('feature').find(f => f.name === 'Task Management');

		if (mainIntent) {
			this.builder.addRelationship(mainIntent.id, collabFeature.id, 'contains');
		}
		if (taskFeature) {
			this.builder.addRelationship(collabFeature.id, taskFeature.id, 'depends_on');
		}

		this.builder.addRelationship(collabFeature.id, collabScreen.id, 'implements');
		this.builder.addRelationship(collabFeature.id, socketService.id, 'implements');

		this.render();
	}

	/**
	 * Simulate AI assistant adding intelligent connections
	 */
	private addAIInsights(): void {
		const nodes = this.builder.getAllNodes();
		const taskService = nodes.find(n => n.name === 'Task Service');
		const userModel = nodes.find(n => n.name === 'User Model');
		const aiEngine = nodes.find(n => n.name === 'AI Recommendation Engine');

		// AI discovers that task service should use user model for personalization
		if (taskService && userModel) {
			this.builder.addRelationship(taskService.id, userModel.id, 'uses', 0.8);
		}

		// AI suggests that authentication feature influences AI recommendations
		const authFeature = nodes.find(n => n.name === 'User Authentication');
		if (authFeature && aiEngine) {
			this.builder.addRelationship(authFeature.id, aiEngine.id, 'influences', 0.6);
		}

		this.render();
	}

	/**
	 * Initialize the demo application
	 */
	public async init(): Promise<void> {
		// Inject demo styles
		const style = document.createElement('style');
		style.textContent = DEMO_STYLE;
		document.head.appendChild(style);

		// Set up container
		this.container = document.getElementById('root');
		if (!this.container) {
			this.container = document.createElement('div');
			this.container.id = 'root';
			document.body.appendChild(this.container);
		}

		this.render();
	}

	/**
	 * Render the memory graph visualization
	 */
	private render(): void {
		if (!this.container) return;

		const graph = this.builder.build();
		const nodes = graph.getAllNodes();
		const relationships = graph.getAllRelationships();

		const DemoApp = () => (
			<div className="demo-container">
				<div className="demo-header">
					<h1 className="demo-title">AIDE Memory Graph - Interactive Demo</h1>
					<p className="demo-subtitle">
						Demonstrating intent-driven development with intelligent graph visualization
					</p>
				</div>
				<div className="demo-content">
					<div className="demo-controls">
						<button
							className="demo-button"
							onClick={() => this.addCollaborationFeature()}
						>
							Add Collaboration
						</button>
						<button
							className="demo-button"
							onClick={() => this.addAIInsights()}
						>
							AI Insights
						</button>
						<button
							className="demo-button"
							onClick={() => window.location.reload()}
						>
							Reset Demo
						</button>
					</div>
					<div className="demo-info">
						<h4>Live Memory Graph</h4>
						<p>
							<strong>{nodes.length}</strong> nodes, <strong>{relationships.length}</strong> relationships
						</p>
						<p>
							This graph represents the project's entire intent and implementation structure.
							Try adding features or AI insights to see real-time updates!
						</p>
					</div>
					<MemoryGraphVisualization
						nodes={nodes}
						relationships={relationships}
						onNodeSelect={(nodeId) => console.log('Selected node:', nodeId)}
						onNodeEdit={(nodeId) => console.log('Edit node:', nodeId)}
						layout="force"
						className="demo-graph"
					/>
				</div>
			</div>
		);

		const root = createRoot(this.container);
		root.render(<DemoApp />);
	}
}

// Initialize demo when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	const demo = new AIDEMemoryDemo();
	demo.init();
});

export { AIDEMemoryDemo };
