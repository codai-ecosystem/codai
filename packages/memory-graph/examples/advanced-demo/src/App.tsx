import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	MemoryGraphEngine,
	MemoryGraphVisualization,
	AnyNode,
	Relationship,
	ApiNode,
	LogicNode,
	FeatureNode
} from '@codai/memory-graph';
import { v4 as uuid } from 'uuid';
import {
	Globe,
	Zap,
	Search,
	Settings,
	Code,
	Brain,
	Network,
	Activity,
	BarChart3,
	Layers
} from 'lucide-react';

// Import our agent runtime components
import { AgentRuntimeDemo, Task, TaskType } from './utils/AgentRuntimeWrapper';
import { AgentControlPanel } from './components/AgentControlPanel';
import { TaskList } from './components/TaskList';
import './components/AgentComponents.css';

// Advanced demo data representing a complex software architecture
const createAdvancedDemoData = () => {
	const nodes: AnyNode[] = [];
	const relationships: Relationship[] = [];

	const now = new Date();
	const version = "1.0.0";
	const graphId = uuid();

	// Core Infrastructure
	const authService: ApiNode = {
		id: 'auth-service',
		type: 'api',
		name: 'Authentication Service',
		description: 'JWT-based authentication with OAuth2 support',
		method: 'POST',
		path: '/auth',
		createdAt: now,
		updatedAt: now,
		version,
		metadata: {
			technology: 'Node.js + Express',
			status: 'production',
			owner: 'Security Team',
			criticalPath: true,
			content: 'Handles user authentication, authorization, and session management'
		}
	};

	const userService: ApiNode = {
		id: 'user-service',
		type: 'api',
		name: 'User Management Service',
		description: 'Comprehensive user profile and account management',
		method: 'GET',
		path: '/users',
		createdAt: now,
		updatedAt: now,
		version,
		metadata: {
			technology: 'Python + FastAPI',
			status: 'production',
			owner: 'Backend Team',
			content: 'CRUD operations for user data, preferences, and account settings'
		}
	};
	const notificationService: LogicNode = {
		id: 'notification-service',
		type: 'logic',
		name: 'Notification Engine',
		description: 'Multi-channel notification system',
		logicType: 'service',
		createdAt: now,
		updatedAt: now,
		version,
		metadata: {
			technology: 'Go + RabbitMQ',
			status: 'production',
			owner: 'Platform Team',
			content: 'Email, SMS, push notifications, and in-app messaging'
		}
	};

	// Data Layer
	const primaryDb: LogicNode = {
		id: 'primary-db',
		type: 'logic',
		name: 'Primary Database',
		description: 'PostgreSQL cluster with read replicas',
		logicType: 'service',
		createdAt: now,
		updatedAt: now,
		version,
		metadata: {
			technology: 'PostgreSQL 15',
			status: 'production',
			owner: 'Database Team',
			criticalPath: true,
			content: 'Main transactional database with ACID compliance'
		}
	};
	const cacheLayer: LogicNode = {
		id: 'cache-layer',
		type: 'logic',
		name: 'Redis Cache Cluster',
		description: 'High-performance caching layer',
		logicType: 'service',
		createdAt: now,
		updatedAt: now,
		version,
		metadata: {
			technology: 'Redis Cluster',
			status: 'production',
			owner: 'Infrastructure Team',
			content: 'Session storage, API response caching, and real-time data'
		}
	};

	const searchEngine: LogicNode = {
		id: 'search-engine',
		type: 'logic',
		name: 'Elasticsearch Cluster',
		description: 'Full-text search and analytics',
		logicType: 'service',
		createdAt: now,
		updatedAt: now,
		version,
		metadata: {
			technology: 'Elasticsearch 8',
			status: 'production',
			owner: 'Data Team',
			content: 'Document indexing, search APIs, and data analytics'
		}
	};

	// Frontend Applications
	const webApp: FeatureNode = {
		id: 'web-app',
		type: 'feature',
		name: 'React Web Application',
		description: 'Main customer-facing web application',
		status: 'deployed',
		priority: 'high',
		createdAt: now,
		updatedAt: now,
		version,
		metadata: {
			technology: 'React 18 + TypeScript',
			status: 'production',
			owner: 'Frontend Team',
			criticalPath: true,
			content: 'SPA with modern React, TypeScript, and state management'
		}
	};
	const mobileApp: FeatureNode = {
		id: 'mobile-app',
		type: 'feature',
		name: 'Mobile Application',
		description: 'Native iOS and Android applications',
		status: 'deployed',
		priority: 'high',
		createdAt: now,
		updatedAt: now,
		version,
		metadata: {
			technology: 'React Native',
			status: 'production',
			owner: 'Mobile Team',
			content: 'React Native app with offline support and push notifications'
		}
	};

	const adminDashboard: FeatureNode = {
		id: 'admin-dashboard',
		type: 'feature',
		name: 'Admin Dashboard',
		description: 'Internal administration and monitoring interface',
		status: 'deployed',
		priority: 'medium',
		createdAt: now,
		updatedAt: now,
		version,
		metadata: {
			technology: 'Vue.js 3',
			status: 'production',
			owner: 'Platform Team',
			content: 'Real-time monitoring, user management, and system controls'
		}
	};

	// AI/ML Components
	const mlPipeline: LogicNode = {
		id: 'ml-pipeline',
		type: 'logic',
		name: 'ML Training Pipeline',
		description: 'Automated machine learning pipeline',
		logicType: 'service',
		createdAt: now,
		updatedAt: now,
		version,
		metadata: {
			technology: 'Python + MLflow',
			status: 'production',
			owner: 'ML Team',
			content: 'Data preprocessing, model training, validation, and deployment'
		}
	};
	const aiService: ApiNode = {
		id: 'ai-service',
		type: 'api',
		name: 'AI Inference Service',
		description: 'Real-time AI model inference',
		method: 'POST',
		path: '/ai/predict',
		createdAt: now,
		updatedAt: now,
		version,
		metadata: {
			technology: 'TensorFlow Serving',
			status: 'production',
			owner: 'ML Team',
			content: 'Recommendation engine, content analysis, and prediction APIs'
		}
	};

	// Infrastructure
	const apiGateway: ApiNode = {
		id: 'api-gateway',
		type: 'api',
		name: 'API Gateway',
		description: 'Central API management and routing',
		method: 'GET',
		path: '/api',
		createdAt: now,
		updatedAt: now,
		version,
		metadata: {
			technology: 'Kong Gateway',
			status: 'production',
			owner: 'Infrastructure Team',
			criticalPath: true,
			content: 'Rate limiting, authentication, routing, and API analytics'
		}
	};

	const monitoringSystem: LogicNode = {
		id: 'monitoring-system',
		type: 'logic',
		name: 'Monitoring & Observability',
		description: 'Comprehensive system monitoring',
		logicType: 'service',
		createdAt: now,
		updatedAt: now,
		version,
		metadata: {
			technology: 'Prometheus + Grafana',
			status: 'production',
			owner: 'SRE Team',
			content: 'Metrics, logging, tracing, and alerting across all services'
		}
	};

	nodes.push(
		authService, userService, notificationService,
		primaryDb, cacheLayer, searchEngine,
		webApp, mobileApp, adminDashboard,
		mlPipeline, aiService,
		apiGateway, monitoringSystem
	);

	// Create relationships	// Since the schema only supports a limited set of relationship types, let's map our use cases to those
	const relationshipData = [
		// Frontend to API Gateway
		{ from: 'web-app', to: 'api-gateway', type: 'uses' },
		{ from: 'mobile-app', to: 'api-gateway', type: 'uses' },
		{ from: 'admin-dashboard', to: 'api-gateway', type: 'uses' },

		// API Gateway to services
		{ from: 'api-gateway', to: 'auth-service', type: 'depends_on' },
		{ from: 'api-gateway', to: 'user-service', type: 'depends_on' },
		{ from: 'api-gateway', to: 'ai-service', type: 'depends_on' },

		// Service dependencies
		{ from: 'auth-service', to: 'primary-db', type: 'depends_on' },
		{ from: 'auth-service', to: 'cache-layer', type: 'uses' },
		{ from: 'user-service', to: 'primary-db', type: 'depends_on' },
		{ from: 'user-service', to: 'cache-layer', type: 'uses' },
		{ from: 'user-service', to: 'notification-service', type: 'uses' },

		// AI/ML connections
		{ from: 'ai-service', to: 'ml-pipeline', type: 'depends_on' },
		{ from: 'ml-pipeline', to: 'primary-db', type: 'uses' },

		// Search and analytics
		{ from: 'web-app', to: 'search-engine', type: 'uses' },
		{ from: 'search-engine', to: 'primary-db', type: 'depends_on' },

		// Monitoring
		{ from: 'monitoring-system', to: 'auth-service', type: 'tests' },
		{ from: 'monitoring-system', to: 'user-service', type: 'tests' },
		{ from: 'monitoring-system', to: 'ai-service', type: 'tests' },
		{ from: 'monitoring-system', to: 'primary-db', type: 'tests' },
		{ from: 'monitoring-system', to: 'api-gateway', type: 'tests' }
	];

	relationshipData.forEach(({ from, to, type }) => {
		relationships.push({
			id: `${from}-${to}`,
			fromNodeId: from,
			toNodeId: to,
			type: type as Relationship['type'],
			metadata: {
				strength: Math.random() * 0.5 + 0.5,
				latency: Math.floor(Math.random() * 100) + 10
			}
		});
	});

	// Create a full MemoryGraph object
	return {
		graph: {
			id: graphId,
			name: "Advanced Software Architecture",
			description: "Complex system architecture visualization with service connections",
			version,
			createdAt: now,
			updatedAt: now,
			nodes,
			relationships,
			metadata: {
				teams: 5,
				services: nodes.length,
				connections: relationships.length
			}
		},
		nodes,
		relationships
	};
};

const NodeIcon = ({ type }: { type: string }) => {
	switch (type) {
		case 'api': return <Globe className="w-4 h-4" />;
		case 'logic': return <Brain className="w-4 h-4" />;
		case 'feature': return <Code className="w-4 h-4" />;
		default: return <Network className="w-4 h-4" />;
	}
};

const StatusBadge = ({ status }: { status: string }) => {
	const colors = {
		production: 'bg-green-500',
		staging: 'bg-yellow-500',
		development: 'bg-blue-500',
		deprecated: 'bg-red-500'
	};

	return (
		<span className={`inline-block w-2 h-2 rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-500'}`} />
	);
};

function App() {
	const [nodes, setNodes] = useState<AnyNode[]>([]);
	const [relationships, setRelationships] = useState<Relationship[]>([]);
	const [selectedNode, setSelectedNode] = useState<AnyNode | null>(null);
	const [filter, setFilter] = useState('');
	const [selectedTeam, setSelectedTeam] = useState('all');
	const [layout, setLayout] = useState<'force' | 'hierarchical' | 'circular'>('force');
	const [editMode, setEditMode] = useState(false);
	const [showMetrics, setShowMetrics] = useState(false);
	const [showTeams, setShowTeams] = useState(false);
	const [showAgentPanel, setShowAgentPanel] = useState(false);

	// Initialize the memory graph engine and agent runtime
	const [memoryGraphEngine] = useState(() => {
		const engine = new MemoryGraphEngine();
		return engine;
	});

	const [agentRuntime] = useState(() => {
		return new AgentRuntimeDemo(memoryGraphEngine);
	});
	// Handle task submission from the agent control panel
	const handleTaskSubmit = async (task: Task) => {
		try {
			// Submit the task to the agent runtime
			await agentRuntime.submitTask(task);
			console.log('Task submitted successfully:', task);
		} catch (error) {
			console.error('Error submitting task:', error);
		}
		console.log('Task submitted:', task);
	};
	// Effect to populate the initial demo data
	useEffect(() => {
		const { nodes: initialNodes, relationships: initialRelationships } = createAdvancedDemoData();
		setNodes(initialNodes);
		setRelationships(initialRelationships);

		// Add the initial nodes and relationships to the memory graph engine
		initialNodes.forEach(node => memoryGraphEngine.addNode(node));
		initialRelationships.forEach(rel => memoryGraphEngine.addRelationship(rel.fromNodeId, rel.toNodeId, rel.type));
	}, [memoryGraphEngine]);

	// Effect to listen for memory graph changes
	useEffect(() => {
		const subscription = memoryGraphEngine.changes$.subscribe(() => {
			const currentGraph = memoryGraphEngine.currentGraph;
			setNodes([...currentGraph.nodes]);
			setRelationships([...currentGraph.relationships]);
		});

		return () => {
			subscription.unsubscribe();
		};
	}, [memoryGraphEngine]);

	const teams = useMemo(() => {
		const teamSet = new Set<string>();
		nodes.forEach(node => {
			if (node.metadata?.owner) {
				teamSet.add(node.metadata.owner as string);
			}
		});
		return Array.from(teamSet).sort();
	}, [nodes]);
	const filteredNodes = useMemo(() => {
		return nodes.filter(node => {
			const matchesFilter = filter === '' ||
				node.name.toLowerCase().includes(filter.toLowerCase()) ||
				(node.description?.toLowerCase()?.includes(filter.toLowerCase()) ?? false);

			const matchesTeam = selectedTeam === 'all' ||
				node.metadata?.owner === selectedTeam;

			return matchesFilter && matchesTeam;
		});
	}, [nodes, filter, selectedTeam]);

	const criticalPath = useMemo(() => {
		return nodes.filter(node => node.metadata?.criticalPath === true);
	}, [nodes]);

	// Add a function to toggle the Agent panel
	const toggleAgentPanel = () => {
		setShowAgentPanel(!showAgentPanel);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
			{/* Header */}
			<header className="border-b border-white/10 backdrop-blur-sm bg-black/20">
				<div className="max-w-7xl mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<Network className="w-8 h-8 text-purple-400" />
							<div>
								<h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
									AIDE Memory Graph
								</h1>
								<p className="text-sm text-gray-400">Advanced Architecture Demo</p>
							</div>
						</div>

						<div className="flex items-center space-x-4">
							<div className="flex items-center space-x-2">
								<Activity className="w-4 h-4 text-green-400" />
								<span className="text-sm text-green-400">Live System</span>
							</div>
							<div className="flex items-center space-x-2">
								<span className="text-sm text-gray-400">{nodes.length} Services</span>
								<span className="text-sm text-gray-400">{relationships.length} Connections</span>
							</div>
						</div>
					</div>
				</div>
			</header>

			<div className="flex h-[calc(100vh-80px)]">
				{/* Sidebar */}
				<div className="w-80 border-r border-white/10 backdrop-blur-sm bg-black/20 overflow-y-auto">
					<div className="p-4 space-y-6">
						{/* Search and Filters */}
						<div className="space-y-4">
							<div className="relative">
								<Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
								<input
									type="text"
									placeholder="Search services..."
									value={filter}
									onChange={(e) => setFilter(e.target.value)}
									className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-400"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">Team</label>								<select
									value={selectedTeam}
									onChange={(e) => setSelectedTeam(e.target.value)}
									className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-400"
									aria-label="Filter by team"
								>
									<option value="all">All Teams</option>
									{teams.map(team => (
										<option key={team} value={team}>{team}</option>
									))}
								</select>
							</div>
						</div>

						{/* Layout Controls */}
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">Layout</label>
							<div className="grid grid-cols-3 gap-2">
								{(['force', 'hierarchical', 'circular'] as const).map((layoutType) => (
									<button
										key={layoutType}
										onClick={() => setLayout(layoutType)}
										className={`px-3 py-2 text-xs rounded-lg transition-colors ${layout === layoutType
											? 'bg-purple-600 text-white'
											: 'bg-white/5 text-gray-300 hover:bg-white/10'
											}`}
									>
										{layoutType}
									</button>
								))}
							</div>
						</div>

						{/* View Options */}
						<div className="space-y-3">
							<button
								onClick={() => setEditMode(!editMode)}
								className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${editMode
									? 'bg-blue-600 text-white'
									: 'bg-white/5 text-gray-300 hover:bg-white/10'
									}`}
							>
								<Settings className="w-4 h-4" />
								<span>Edit Mode</span>
							</button>

							<button
								onClick={() => setShowMetrics(!showMetrics)}
								className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${showMetrics
									? 'bg-green-600 text-white'
									: 'bg-white/5 text-gray-300 hover:bg-white/10'
									}`}
							>
								<BarChart3 className="w-4 h-4" />
								<span>Metrics</span>
							</button>							<button
								onClick={toggleAgentPanel}
								className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${showAgentPanel
									? 'bg-blue-600 text-white'
									: 'bg-white/5 text-gray-300 hover:bg-white/10'
									}`}
							>
								<Brain className="w-4 h-4" />
								<span>{showAgentPanel ? 'Hide Agent Panel' : 'Show Agent Panel'}</span>
							</button>
						</div>

						{/* Agent Panel (conditionally rendered) */}
						{showAgentPanel && (
							<div className="space-y-4 mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
								<AgentControlPanel
									agentRuntime={agentRuntime}
									onTaskSubmit={handleTaskSubmit}
								/>
								<TaskList
									agentRuntime={agentRuntime}
									maxItems={5}
								/>
							</div>
						)}

						{/* Critical Path */}
						<div>
							<h3 className="text-sm font-medium text-red-400 mb-2 flex items-center space-x-2">
								<Zap className="w-4 h-4" />
								<span>Critical Path ({criticalPath.length})</span>
							</h3>
							<div className="space-y-2">
								{criticalPath.map(node => (
									<div
										key={node.id}
										onClick={() => setSelectedNode(node)}
										className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg cursor-pointer hover:bg-red-500/20 transition-colors"
									>
										<div className="flex items-center space-x-2">
											<NodeIcon type={node.type} />
											<span className="text-sm text-red-300">{node.name}</span>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Services List */}
						<div>
							<h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
								<Layers className="w-4 h-4" />
								<span>Services ({filteredNodes.length})</span>
							</h3>
							<div className="space-y-2">
								{filteredNodes.map(node => (
									<div
										key={node.id}
										onClick={() => setSelectedNode(node)}
										className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedNode?.id === node.id
											? 'bg-purple-600/30 border border-purple-400/50'
											: 'bg-white/5 hover:bg-white/10 border border-white/10'
											}`}
									>
										<div className="flex items-start space-x-3">
											<NodeIcon type={node.type} />
											<div className="flex-1 min-w-0">
												<div className="flex items-center space-x-2">
													<span className="text-sm font-medium truncate">{node.name}</span>
													<StatusBadge status={node.metadata?.status as string || 'unknown'} />
												</div>
												<p className="text-xs text-gray-400 mt-1 truncate">{node.description}</p>												{node.metadata && 'technology' in node.metadata && (
													<p className="text-xs text-purple-300 mt-1">{String(node.metadata.technology)}</p>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className="flex-1 flex">					{/* Graph View */}
					<div className="flex-1 relative">						<MemoryGraphVisualization
						graph={{
							id: 'memory-graph',
							name: 'Memory Graph',
							createdAt: new Date(),
							updatedAt: new Date(),
							version: '1.0.0',
							nodes: filteredNodes,
							relationships: relationships.filter(rel =>
								filteredNodes.some(n => n.id === rel.fromNodeId) &&
								filteredNodes.some(n => n.id === rel.toNodeId)
							)
						}}
						layout={layout}
						isEditable={editMode}
						onNodeSelect={setSelectedNode}
						className="w-full h-full"
					/>

						{showMetrics && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg p-4 min-w-64"
							>
								<h3 className="text-sm font-medium text-gray-300 mb-3">System Metrics</h3>
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span className="text-gray-400">Total Services:</span>
										<span className="text-white">{nodes.length}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-gray-400">Active Connections:</span>
										<span className="text-green-400">{relationships.length}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-gray-400">Critical Services:</span>
										<span className="text-red-400">{criticalPath.length}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-gray-400">Teams:</span>
										<span className="text-purple-400">{teams.length}</span>
									</div>
								</div>
							</motion.div>
						)}
					</div>

					{/* Details Panel */}
					<AnimatePresence>
						{selectedNode && (
							<motion.div
								initial={{ width: 0, opacity: 0 }}
								animate={{ width: 400, opacity: 1 }}
								exit={{ width: 0, opacity: 0 }}
								className="border-l border-white/10 backdrop-blur-sm bg-black/20 overflow-hidden"
							>
								<div className="p-6 h-full overflow-y-auto">
									<div className="space-y-6">
										<div>
											<div className="flex items-start space-x-3 mb-4">
												<NodeIcon type={selectedNode.type} />
												<div className="flex-1">
													<h2 className="text-xl font-bold text-white">{selectedNode.name}</h2>
													<p className="text-gray-400 text-sm mt-1">{selectedNode.description}</p>
												</div>
												<StatusBadge status={selectedNode.metadata?.status as string || 'unknown'} />
											</div>

											<div className="bg-white/5 rounded-lg p-4">
												<p className="text-gray-300 text-sm leading-relaxed">
													{selectedNode.metadata?.content ?
														selectedNode.metadata.content as string :
														selectedNode.description}
												</p>
											</div>
										</div>

										{selectedNode.metadata && (
											<div>
												<h3 className="text-sm font-medium text-gray-300 mb-3">Metadata</h3>
												<div className="space-y-2">
													{Object.entries(selectedNode.metadata).map(([key, value]) => (
														<div key={key} className="flex justify-between text-sm">
															<span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
															<span className="text-white text-right max-w-48 truncate">
																{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
															</span>
														</div>
													))}
												</div>
											</div>
										)}

										<div>
											<h3 className="text-sm font-medium text-gray-300 mb-3">Connections</h3>
											<div className="space-y-2">											{relationships
												.filter(rel => rel.fromNodeId === selectedNode.id || rel.toNodeId === selectedNode.id)
												.map(rel => {
													const isOutgoing = rel.fromNodeId === selectedNode.id;
													const connectedNodeId = isOutgoing ? rel.toNodeId : rel.fromNodeId;
													const connectedNode = nodes.find(n => n.id === connectedNodeId);

													return (
														<div key={rel.id} className="flex items-center space-x-2 text-sm">
															<span className={`px-2 py-1 rounded text-xs ${isOutgoing ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'
																}`}>
																{isOutgoing ? '→' : '←'} {rel.type.replace('_', ' ')}
															</span>
															<span className="text-gray-300 truncate">{connectedNode?.name}</span>
														</div>
													);
												})}
											</div>
										</div>
									</div>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</div>
	);
}

export default App;
