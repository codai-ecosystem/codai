import React, { useState, useCallback, useMemo } from 'react';
import { MemoryGraphVisualization } from '../../../src';
import type { MemoryGraph, AnyNode, Relationship } from '../../../src';

type LayoutType = 'force' | 'hierarchical' | 'circular';

// Sample data demonstrating different node types and relationships
const createSampleGraph = (): MemoryGraph => ({
	id: 'sample-project',
	name: 'AIDE Project Structure',
	version: '1.0.0',
	createdAt: new Date(),
	updatedAt: new Date(),
	nodes: [
		{
			id: 'core-auth',
			name: 'Authentication System',
			type: 'feature',
			description: 'Core user authentication and authorization system',
			version: '1.2.0',
			createdAt: new Date('2024-01-15'),
			updatedAt: new Date('2024-03-10'),
			status: 'implemented',
			priority: 'critical',
			requirements: ['Support OAuth 2.0', 'Multi-factor authentication', 'Session management'],
			metadata: {
				team: 'security',
				complexity: 'high',
			},
		},
		{
			id: 'ui-components',
			name: 'UI Component Library',
			type: 'feature',
			description: 'Reusable React components for the application',
			version: '2.1.0',
			createdAt: new Date('2024-01-10'),
			updatedAt: new Date('2024-03-15'),
			status: 'implemented',
			priority: 'high',
			requirements: ['TypeScript support', 'Accessibility compliance', 'Responsive design'],
			metadata: {
				team: 'frontend',
				complexity: 'medium',
			},
		},
		{
			id: 'api-gateway',
			name: 'API Gateway',
			type: 'api',
			description: 'Central API gateway for microservices',
			version: '1.0.0',
			createdAt: new Date('2024-02-01'),
			updatedAt: new Date('2024-03-01'),
			method: 'GET',
			path: '/api/v1/*',
			authentication: 'bearer',
			rateLimit: 1000,
			metadata: {
				team: 'backend',
				complexity: 'high',
			},
		},
		{
			id: 'memory-graph',
			name: 'Memory Graph System',
			type: 'feature',
			description: 'Interactive visualization of project memory and relationships',
			version: '0.1.0',
			createdAt: new Date('2024-03-01'),
			updatedAt: new Date('2024-03-20'),
			status: 'in_progress',
			priority: 'medium',
			requirements: ['React components', 'Graph visualization', 'Interactive controls'],
			metadata: {
				team: 'frontend',
				complexity: 'high',
			},
		},
		{
			id: 'database-layer',
			name: 'Database Abstraction Layer',
			type: 'logic',
			description: 'Abstraction layer for database operations',
			version: '1.1.0',
			createdAt: new Date('2024-01-20'),
			updatedAt: new Date('2024-02-28'),
			logicType: 'service',
			implementation: 'Database service with connection pooling',
			metadata: {
				team: 'backend',
				complexity: 'medium',
			},
		},
		{
			id: 'notification-system',
			name: 'Notification Service',
			type: 'logic',
			description: 'Real-time notification system',
			version: '1.0.0',
			createdAt: new Date('2024-02-15'),
			updatedAt: new Date('2024-03-05'),
			logicType: 'service',
			implementation: 'WebSocket-based notification system',
			metadata: {
				team: 'backend',
				complexity: 'medium',
			},
		},
	],
	relationships: [
		{
			id: 'auth-api-rel',
			fromNodeId: 'core-auth',
			toNodeId: 'api-gateway',
			type: 'uses',
			metadata: {
				description: 'Authentication system integrates with API gateway for request validation',
			},
		},
		{
			id: 'ui-memory-rel',
			fromNodeId: 'memory-graph',
			toNodeId: 'ui-components',
			type: 'uses',
			metadata: {
				description: 'Memory graph uses UI components for visualization',
			},
		},
		{
			id: 'api-db-rel',
			fromNodeId: 'api-gateway',
			toNodeId: 'database-layer',
			type: 'depends_on',
			metadata: {
				description: 'API gateway depends on database layer for data operations',
			},
		},
		{
			id: 'api-notif-rel',
			fromNodeId: 'api-gateway',
			toNodeId: 'notification-system',
			type: 'uses',
			metadata: {
				description: 'API gateway uses notification system for events',
			},
		},
		{
			id: 'auth-db-rel',
			fromNodeId: 'core-auth',
			toNodeId: 'database-layer',
			type: 'depends_on',
			metadata: {
				description: 'Authentication system stores user data in database',
			},
		},
		{
			id: 'memory-notif-rel',
			fromNodeId: 'memory-graph',
			toNodeId: 'notification-system',
			type: 'uses',
			metadata: {
				description: 'Memory graph can send notifications for updates',
			},
		},
	],
});

const App: React.FC = () => {
	const [selectedNode, setSelectedNode] = useState<AnyNode | null>(null);
	const [layout, setLayout] = useState<LayoutType>('force');
	const [isEditable, setIsEditable] = useState(false);
	const [showRelationships, setShowRelationships] = useState(true);

	const graph = useMemo(() => createSampleGraph(), []);

	const handleNodeSelect = useCallback((node: AnyNode | null) => {
		setSelectedNode(node);
	}, []);

	const handleRelationshipDelete = useCallback((edgeId: string) => {
		console.log('Deleting relationship:', edgeId);
		// In a real application, this would update the graph data
	}, []);

	const layouts: { value: LayoutType; label: string; description: string }[] = [
		{
			value: 'force',
			label: 'Force Layout',
			description: 'Physics-based layout with node attraction and repulsion',
		},
		{
			value: 'hierarchical',
			label: 'Hierarchical',
			description: 'Top-down tree structure showing dependencies',
		},
		{
			value: 'circular',
			label: 'Circular',
			description: 'Nodes arranged in a circular pattern',
		},
	];

	return (
		<div className="demo-container">
			<header className="demo-header">
				<h1 className="demo-title">AIDE Memory Graph Demo</h1>
				<p className="demo-subtitle">
					Interactive visualization of project structure and relationships
				</p>
			</header>

			<div className="demo-content">
				<aside className="demo-sidebar">
					<div className="control-section">
						<h3>Layout Options</h3>{' '}
						{layouts.map(layoutOption => (
							<div key={layoutOption.value} className="control-group">
								<button
									className={`control-button ${layout === layoutOption.value ? 'active' : ''}`}
									onClick={() => setLayout(layoutOption.value)}
								>
									{layoutOption.label}
								</button>
								<p className="layout-description">{layoutOption.description}</p>
							</div>
						))}
					</div>
					<div className="control-section">
						<h3>Display Options</h3>
						<div className="control-group">
							<label className="control-checkbox">
								<input
									type="checkbox"
									checked={isEditable}
									onChange={e => setIsEditable(e.target.checked)}
								/>
								Enable editing mode
							</label>
						</div>
						<div className="control-group">
							<label className="control-checkbox">
								<input
									type="checkbox"
									checked={showRelationships}
									onChange={e => setShowRelationships(e.target.checked)}
								/>
								Show relationships
							</label>
						</div>
					</div>{' '}
					{selectedNode && (
						<div className="control-section">
							<h3>Selected Node</h3>
							<div className="info-panel">
								<h4>{selectedNode.name}</h4>
								<p>
									<strong>Type:</strong> {selectedNode.type}
								</p>
								{selectedNode.type === 'feature' && (
									<>
										<p>
											<strong>Status:</strong> {selectedNode.status}
										</p>
										<p>
											<strong>Priority:</strong> {selectedNode.priority}
										</p>
									</>
								)}
								{selectedNode.type === 'api' && (
									<>
										<p>
											<strong>Method:</strong> {selectedNode.method}
										</p>
										<p>
											<strong>Path:</strong> {selectedNode.path}
										</p>
									</>
								)}
								{selectedNode.type === 'logic' && (
									<p>
										<strong>Logic Type:</strong> {selectedNode.logicType}
									</p>
								)}
								<p>
									<strong>Version:</strong> {selectedNode.version}
								</p>
								{selectedNode.description && (
									<p>
										<strong>Description:</strong> {selectedNode.description}
									</p>
								)}
								{selectedNode.type === 'feature' &&
									selectedNode.requirements &&
									selectedNode.requirements.length > 0 && (
										<div>
											<strong>Requirements:</strong>
											<ul className="requirements-list">
												{selectedNode.requirements.map((req: string, index: number) => (
													<li key={index} className="requirement-item">
														{req}
													</li>
												))}
											</ul>
										</div>
									)}
							</div>
						</div>
					)}
					<div className="control-section">
						<h3>Demo Features</h3>
						<div className="info-panel">
							<p>
								🔍 <strong>Click</strong> nodes to select and view details
							</p>
							<p>
								🔄 <strong>Mouse wheel</strong> to zoom in/out
							</p>
							<p>
								✋ <strong>Drag</strong> to pan around the graph
							</p>
							<p>
								⚙️ <strong>Change layouts</strong> to see different arrangements
							</p>
							<p>
								✏️ <strong>Enable editing</strong> to interact with relationships
							</p>
						</div>
					</div>
				</aside>

				<main className="demo-main">
					<div className="graph-container">
						{' '}
						<MemoryGraphVisualization
							graph={graph}
							layout={layout}
							onNodeSelect={handleNodeSelect}
							onRelationshipDelete={isEditable ? handleRelationshipDelete : undefined}
							isEditable={isEditable}
						/>
					</div>
				</main>
			</div>
		</div>
	);
};

export default App;
