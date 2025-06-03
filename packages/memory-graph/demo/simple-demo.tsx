/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import React from 'react';
import { createRoot } from 'react-dom/client';
import {
	MemoryGraphEngine,
	GraphBuilders
} from '@aide/memory-graph';

/**
 * Simple demo showcasing AIDE's memory graph capabilities
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
		padding: 2rem;
	}
	.demo-title {
		color: #007acc;
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}
	.graph-info {
		background: #1e1e3f;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
	}
	.node-list {
		list-style: none;
		padding: 0;
	}
	.node-item {
		padding: 0.5rem;
		margin: 0.5rem 0;
		background: #2d2d5f;
		border-radius: 4px;
		border-left: 3px solid #007acc;
	}
`;

class SimpleAIDEDemo {
	private engine: MemoryGraphEngine;
	private container: HTMLElement | null = null;

	constructor() {
		this.engine = new MemoryGraphEngine();
		this.setupDemoGraph();
	}

	private setupDemoGraph(): void {
		// Create a simple intent
		const mainIntent = this.engine.addNode(
			GraphBuilders.intent('Task Management App')
				.withDescription('Build a modern task management application')
				.withCategory('goal')
				.withPriority('high')
				.withStatus('active')
				.withContext('User wants to replace current inefficient task tracking')
				.build()
		);

		// Create a feature
		const authFeature = this.engine.addNode(
			GraphBuilders.feature('User Authentication')
				.withDescription('Secure user registration and login system')
				.withStatus('implemented')
				.withPriority('critical')
				.withMetadata({
					requirements: [
						'Email/password registration',
						'Social login (Google, GitHub)',
						'Password reset functionality'
					],
					estimatedComplexity: 7
				})
				.build()
		);

		// Create a screen
		const loginScreen = this.engine.addNode(
			GraphBuilders.screen('Login Screen')
				.withDescription('User authentication interface')
				.withMetadata({
					uiFramework: 'React',
					responsiveBreakpoints: ['mobile', 'tablet', 'desktop']
				})
				.build()
		);

		// Create relationships
		this.engine.addRelationship(
			GraphBuilders.relationship(mainIntent.id, authFeature.id, 'contains')
				.build()
		);

		this.engine.addRelationship(
			GraphBuilders.relationship(authFeature.id, loginScreen.id, 'implements')
				.build()
		);
	}

	private renderGraph(): string {
		const graph = this.engine.currentGraph;
		const nodes = graph.nodes;
		const relationships = graph.relationships;

		return `
			<div class="demo-container">
				<h1 class="demo-title">AIDE Memory Graph Demo</h1>
				<div class="graph-info">
					<p><strong>Graph:</strong> ${graph.name}</p>
					<p><strong>Nodes:</strong> ${nodes.length} | <strong>Relationships:</strong> ${relationships.length}</p>
				</div>
				<div class="graph-info">
					<h3>Nodes:</h3>
					<ul class="node-list">
						${nodes.map(node => `
							<li class="node-item">
								<strong>${node.name}</strong> (${node.type})
								<br><small>${node.description || 'No description'}</small>
							</li>
						`).join('')}
					</ul>
				</div>
				<div class="graph-info">
					<h3>Relationships:</h3>
					<ul class="node-list">
						${relationships.map(rel => {
			const fromNode = nodes.find(n => n.id === rel.fromNodeId);
			const toNode = nodes.find(n => n.id === rel.toNodeId);
			return `
								<li class="node-item">
									<strong>${fromNode?.name || 'Unknown'}</strong>
									→ ${rel.type} →
									<strong>${toNode?.name || 'Unknown'}</strong>
								</li>
							`;
		}).join('')}
					</ul>
				</div>
			</div>
		`;
	}

	mount(containerId: string): void {
		const container = document.getElementById(containerId);
		if (!container) {
			throw new Error(`Container element with id "${containerId}" not found`);
		}

		this.container = container;

		// Add styles
		const styleElement = document.createElement('style');
		styleElement.textContent = DEMO_STYLE;
		document.head.appendChild(styleElement);

		// Render the demo
		container.innerHTML = this.renderGraph();
	}
}

// Initialize demo when DOM is ready
function initDemo(): void {
	const demo = new SimpleAIDEDemo();

	// Create container if it doesn't exist
	let container = document.getElementById('aide-demo');
	if (!container) {
		container = document.createElement('div');
		container.id = 'aide-demo';
		document.body.appendChild(container);
	}

	demo.mount('aide-demo');
}

// Auto-start if this is running in a browser
if (typeof window !== 'undefined') {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initDemo);
	} else {
		initDemo();
	}
}

export { SimpleAIDEDemo, initDemo };
