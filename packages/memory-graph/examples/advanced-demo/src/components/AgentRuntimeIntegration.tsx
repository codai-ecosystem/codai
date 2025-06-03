import { useState, useEffect } from 'react';
import { MemoryGraphEngine, AnyNode, Relationship } from '@aide/memory-graph';
import { Task, TaskResult, AgentRuntimeDemo } from '../utils/AgentRuntimeWrapper';

interface AgentRuntimeIntegrationProps {
	memoryGraphEngine: MemoryGraphEngine;
	onTaskStarted?: (task: Task) => void;
	onTaskCompleted?: (task: Task, result: TaskResult) => void;
	onGraphUpdated?: (nodes: AnyNode[], relationships: Relationship[]) => void;
}

/**
 * Component that integrates the AgentRuntime with a MemoryGraphEngine
 * Allows agents to interact with and modify the memory graph
 */
export const AgentRuntimeIntegration = ({
	memoryGraphEngine,
	onTaskStarted,
	onTaskCompleted,
	onGraphUpdated
}: AgentRuntimeIntegrationProps) => {
	const [agentRuntime, setAgentRuntime] = useState<AgentRuntimeDemo | null>(null);
	const [activeAgents, setActiveAgents] = useState<string[]>([]);
	const [activeTasks, setActiveTasks] = useState<Task[]>([]);

	// Initialize the agent runtime when the component mounts
	useEffect(() => {
		const runtime = new AgentRuntimeDemo(memoryGraphEngine);
		setAgentRuntime(runtime);

		// Subscribe to agent runtime events
		const taskSubscription = runtime.tasks$.subscribe(event => {
			if (event.type === 'started') {
				setActiveTasks(prev => [...prev, event.task]);
				onTaskStarted?.(event.task);
			} else if (event.type === 'completed' && event.result) {
				setActiveTasks(prev => prev.filter(t => t.id !== event.task.id));
				onTaskCompleted?.(event.task, event.result);
			}
		});

		// Subscribe to memory graph changes
		const graphSubscription = memoryGraphEngine.changes$.subscribe(() => {
			const currentGraph = memoryGraphEngine.currentGraph;
			onGraphUpdated?.(currentGraph.nodes, currentGraph.relationships);
		});

		// Track active agents
		const statusSubscription = runtime.status$.subscribe(status => {
			if (status.agentId) {
				setActiveAgents(prev =>
					prev.includes(status.agentId) ? prev : [...prev, status.agentId]
				);
			}
		});

		return () => {
			taskSubscription.unsubscribe();
			graphSubscription.unsubscribe();
			statusSubscription.unsubscribe();
		};
	}, [memoryGraphEngine, onTaskStarted, onTaskCompleted, onGraphUpdated]);

	return (
		<div className="agent-runtime-info">
			<div className="agent-status">
				{activeAgents.length > 0 ? (
					<div>
						<h3>Active Agents</h3>
						<ul>
							{activeAgents.map(agentId => (
								<li key={agentId}>{agentId}</li>
							))}
						</ul>
					</div>
				) : (
					<p>No active agents</p>
				)}
			</div>

			<div className="task-status">
				{activeTasks.length > 0 ? (
					<div>
						<h3>Active Tasks</h3>
						<ul>
							{activeTasks.map(task => (
								<li key={task.id}>
									<strong>{task.type}</strong>: {task.description}
								</li>
							))}
						</ul>
					</div>
				) : (
					<p>No active tasks</p>
				)}
			</div>
		</div>
	);
};
