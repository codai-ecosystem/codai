import { useState, useEffect } from 'react';
import { Task, TaskResult, TaskStatus, AgentRuntimeDemo } from '../utils/AgentRuntimeWrapper';
import { CheckCircle, AlertCircle, Clock, Play, XCircle } from 'lucide-react';

interface TaskListProps {
	agentRuntime: AgentRuntimeDemo | null;
	maxItems?: number;
}

// Extended Task type for UI state
interface ExtendedTask extends Task {
	status: TaskStatus;
	result?: TaskResult;
	error?: string;
}

/**
 * Displays a list of tasks from the agent runtime system
 * Shows task status, description, and results
 */
export const TaskList = ({
	agentRuntime,
	maxItems = 10
}: TaskListProps) => {
	const [tasks, setTasks] = useState<ExtendedTask[]>([]);

	useEffect(() => {
		if (!agentRuntime) return;

		const taskSubscription = agentRuntime.tasks$.subscribe(event => {
			if (event.type === 'started') {
				const updatedTask: ExtendedTask = {
					...event.task,
					status: 'in_progress'
				};

				setTasks(prev => [
					updatedTask,
					...prev
				].slice(0, maxItems));
			} else if (event.type === 'completed') {
				setTasks(prev =>
					prev.map(task =>
						task.id === event.task.id
							? { ...task, status: 'completed', result: event.result }
							: task
					)
				);
			} else if (event.type === 'failed') {
				setTasks(prev =>
					prev.map(task =>
						task.id === event.task.id
							? { ...task, status: 'failed', error: event.error }
							: task
					)
				);
			}
		});

		return () => {
			taskSubscription.unsubscribe();
		};
	}, [agentRuntime, maxItems]);
	const getStatusIcon = (status: TaskStatus) => {
		switch (status) {
			case 'completed':
				return <CheckCircle className="status-icon completed" size={18} />;
			case 'failed':
				return <AlertCircle className="status-icon failed" size={18} />;
			case 'pending':
				return <Clock className="status-icon pending" size={18} />;
			case 'in_progress':
				return <Play className="status-icon in-progress" size={18} />;
			case 'cancelled':
				return <XCircle className="status-icon cancelled" size={18} />;
			default:
				return <Clock className="status-icon" size={18} />;
		}
	};

	const formatTimestamp = (date: Date) => {
		return new Date(date).toLocaleTimeString();
	};

	return (
		<div className="task-list">
			<div className="list-header">
				<h2>Recent Tasks</h2>
				{agentRuntime && tasks.length === 0 && (
					<p className="empty-state">No tasks have been submitted yet</p>
				)}
				{!agentRuntime && (
					<p className="empty-state">Agent runtime not connected</p>
				)}
			</div>

			<div className="task-items">
				{tasks.map(task => (
					<div key={task.id} className={`task-item ${task.status}`}>
						<div className="task-header">
							{getStatusIcon(task.status)}
							<span className="task-title">{task.type}</span>
							<span className="task-time">{formatTimestamp(task.createdAt)}</span>
						</div>
						<p className="task-description">{task.description}</p>
						{task.status === 'completed' && task.result && (
							<div className="task-result">
								<h4>Result:</h4>
								<p>{task.result.success ? 'Success' : 'Failed'}: {task.result.summary}</p>
							</div>
						)}

						{task.status === 'failed' && task.error && (
							<div className="task-error">
								<h4>Error:</h4>
								<p>{task.error}</p>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
};
