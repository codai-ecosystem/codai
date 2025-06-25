'use client';

import React, { useState, useEffect } from 'react';

interface Agent {
	id: string;
	name: string;
	description: string;
	status: string;
	capabilities: string[];
}

interface Task {
	id: string;
	title: string;
	description: string;
	agentId: string;
	status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
	progress: number;
	createdAt: string;
	startedAt?: string;
	completedAt?: string;
	outputs?: Record<string, unknown>;
	error?: string;
}

interface Conversation {
	id: string;
	messages: Array<{
		id: string;
		agentId: string;
		type: string;
		content: string;
		timestamp: string;
		metadata?: Record<string, unknown>;
	}>;
	lastActivity: string;
}

export default function AgentsPage() {
	const [agents, setAgents] = useState<Agent[]>([]);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Form state
	const [taskTitle, setTaskTitle] = useState('');
	const [taskDescription, setTaskDescription] = useState('');
	const [selectedAgent, setSelectedAgent] = useState('planner');
	const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'critical'>(
		'medium'
	);

	// Selected task state
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);
	const [conversation, setConversation] = useState<Conversation | null>(null);
	const [message, setMessage] = useState('');
	const [sendingMessage, setSendingMessage] = useState(false);

	useEffect(() => {
		loadAgents();
		loadTasks();
	}, []);

	const loadAgents = async () => {
		try {
			const token = localStorage.getItem('aide_auth_token');
			const response = await fetch('/api/agents', {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error('Failed to load agents');
			}

			const data = await response.json();
			setAgents(data.data.agents || []);
		} catch (err) {
			console.error('Error loading agents:', err);
			setError('Failed to load agents');
		}
	};

	const loadTasks = async () => {
		setLoading(true);
		try {
			// For now, we'll maintain a local state of tasks
			// In a real app, this would fetch from the backend
			setTasks([]);
		} catch (err) {
			console.error('Error loading tasks:', err);
			setError('Failed to load tasks');
		} finally {
			setLoading(false);
		}
	};

	const createTask = async () => {
		if (!taskTitle.trim() || !taskDescription.trim()) {
			setError('Please provide both title and description');
			return;
		}

		setCreating(true);
		setError(null);

		try {
			const token = localStorage.getItem('aide_auth_token');
			const response = await fetch('/api/agents', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					task: {
						title: taskTitle,
						description: taskDescription,
						type: 'user_request',
						priority: taskPriority,
					},
					agentIds: [selectedAgent],
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to create task');
			}

			const data = await response.json();
			const newTask = data.data.task;

			setTasks(prev => [newTask, ...prev]);
			setTaskTitle('');
			setTaskDescription('');
			setSelectedTask(newTask);

			// Start polling for task updates
			pollTaskUpdates(newTask.id);
		} catch (err) {
			console.error('Error creating task:', err);
			setError('Failed to create task');
		} finally {
			setCreating(false);
		}
	};

	const pollTaskUpdates = async (taskId: string) => {
		const pollInterval = setInterval(async () => {
			try {
				const token = localStorage.getItem('aide_auth_token');
				const response = await fetch(`/api/agents/${taskId}`, {
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
				});

				if (response.ok) {
					const data = await response.json();
					const updatedTask = data.data.task;
					const updatedConversation = data.data.conversation;

					// Update task in list
					setTasks(prev => prev.map(t => (t.id === taskId ? updatedTask : t)));

					// Update selected task if it's the same
					if (selectedTask?.id === taskId) {
						setSelectedTask(updatedTask);
					}

					// Update conversation
					if (updatedConversation) {
						setConversation(updatedConversation);
					}

					// Stop polling if task is complete
					if (updatedTask.status === 'completed' || updatedTask.status === 'failed') {
						clearInterval(pollInterval);
					}
				}
			} catch (err) {
				console.error('Error polling task updates:', err);
			}
		}, 2000);

		// Cleanup interval after 5 minutes
		setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
	};

	const sendMessage = async () => {
		if (!message.trim() || !selectedTask) return;

		setSendingMessage(true);
		try {
			const token = localStorage.getItem('aide_auth_token');
			const response = await fetch(`/api/agents/${selectedTask.id}`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					action: 'send_message',
					message: message,
				}),
			});

			if (response.ok) {
				setMessage('');
				// Trigger a refresh of the task
				pollTaskUpdates(selectedTask.id);
			}
		} catch (err) {
			console.error('Error sending message:', err);
		} finally {
			setSendingMessage(false);
		}
	};

	const getStatusBadge = (status: string) => {
		const colors =
			{
				completed: 'bg-green-100 text-green-800',
				failed: 'bg-red-100 text-red-800',
				in_progress: 'bg-blue-100 text-blue-800',
				pending: 'bg-yellow-100 text-yellow-800',
			}[status] || 'bg-gray-100 text-gray-800';

		return (
			<span className={`px-2 py-1 rounded-full text-xs font-medium ${colors}`}>
				{status.replace('_', ' ')}
			</span>
		);
	};

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">AI Agents</h1>
					<p className="text-gray-600">Manage and interact with your AI agents</p>
				</div>
				<button
					onClick={loadAgents}
					disabled={loading}
					className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
				>
					{loading ? 'Loading...' : 'Refresh'}
				</button>
			</div>

			{error && (
				<div className="bg-red-50 border border-red-200 rounded-md p-4">
					<p className="text-red-800">{error}</p>
				</div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Available Agents */}
				<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
					<div className="px-6 py-4 border-b border-gray-200">
						<h2 className="text-lg font-semibold">Available Agents</h2>
						<p className="text-sm text-gray-600">Your AI agents and their current status</p>
					</div>
					<div className="p-6">
						{loading ? (
							<div className="flex items-center justify-center p-4">
								<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
							</div>
						) : agents.length === 0 ? (
							<p className="text-gray-500 text-center py-4">No agents available</p>
						) : (
							<div className="space-y-3">
								{agents.map(agent => (
									<div
										key={agent.id}
										className="flex items-center justify-between p-3 border rounded-lg"
									>
										<div className="flex-1">
											<h3 className="font-medium">{agent.name}</h3>
											<p className="text-sm text-gray-600">{agent.description}</p>
											<div className="flex gap-1 mt-1">
												{agent.capabilities.map(cap => (
													<span
														key={cap}
														className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
													>
														{cap}
													</span>
												))}
											</div>
										</div>
										<span
											className={`px-2 py-1 rounded text-xs font-medium ${
												agent.status === 'available'
													? 'bg-green-100 text-green-800'
													: 'bg-gray-100 text-gray-800'
											}`}
										>
											{agent.status}
										</span>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Create New Task */}
				<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
					<div className="px-6 py-4 border-b border-gray-200">
						<h2 className="text-lg font-semibold">Create New Task</h2>
						<p className="text-sm text-gray-600">Start a new task with your AI agents</p>
					</div>
					<div className="p-6 space-y-4">
						<div>
							<label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-1">
								Task Title
							</label>
							<input
								id="task-title"
								type="text"
								value={taskTitle}
								onChange={e => setTaskTitle(e.target.value)}
								placeholder="e.g., Build a todo app"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label
								htmlFor="task-description"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Description
							</label>
							<textarea
								id="task-description"
								value={taskDescription}
								onChange={e => setTaskDescription(e.target.value)}
								placeholder="Provide detailed requirements and context..."
								rows={4}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label
									htmlFor="agent-select"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Primary Agent
								</label>
								<select
									id="agent-select"
									value={selectedAgent}
									onChange={e => setSelectedAgent(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									{agents.map(agent => (
										<option key={agent.id} value={agent.id}>
											{agent.name}
										</option>
									))}
								</select>
							</div>

							<div>
								<label
									htmlFor="priority-select"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Priority
								</label>
								<select
									id="priority-select"
									value={taskPriority}
									onChange={e => setTaskPriority(e.target.value as any)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="low">Low</option>
									<option value="medium">Medium</option>
									<option value="high">High</option>
									<option value="critical">Critical</option>
								</select>
							</div>
						</div>

						<button
							onClick={createTask}
							disabled={creating}
							className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
						>
							{creating ? 'Creating Task...' : 'Start Task'}
						</button>
					</div>
				</div>
			</div>

			{/* Task List */}
			<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
				<div className="px-6 py-4 border-b border-gray-200">
					<h2 className="text-lg font-semibold">Recent Tasks</h2>
					<p className="text-sm text-gray-600">Your recent AI agent tasks and their status</p>
				</div>
				<div className="p-6">
					{tasks.length === 0 ? (
						<p className="text-gray-500 text-center py-8">
							No tasks yet. Create one above to get started!
						</p>
					) : (
						<div className="space-y-3">
							{tasks.map(task => (
								<div
									key={task.id}
									className={`p-4 border rounded-lg cursor-pointer transition-colors ${
										selectedTask?.id === task.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
									}`}
									onClick={() => setSelectedTask(task)}
								>
									<div className="flex items-center justify-between">
										<div className="flex-1">
											<div className="flex items-center gap-2">
												<h3 className="font-medium">{task.title}</h3>
												{getStatusBadge(task.status)}
											</div>
											<p className="text-sm text-gray-600 mt-1">{task.description}</p>
											<div className="flex gap-4 text-xs text-gray-500 mt-2">
												<span>Agent: {task.agentId}</span>
												<span>Created: {new Date(task.createdAt).toLocaleString()}</span>
												{task.progress > 0 && <span>Progress: {task.progress}%</span>}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Task Details & Conversation */}
			{selectedTask && (
				<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
					<div className="px-6 py-4 border-b border-gray-200">
						<h2 className="text-lg font-semibold">Task: {selectedTask.title}</h2>
						<p className="text-sm text-gray-600">
							Status: {selectedTask.status} | Agent: {selectedTask.agentId}
						</p>
					</div>
					<div className="p-6 space-y-4">
						{/* Task Progress */}
						{selectedTask.progress > 0 && (
							<div>
								<div className="flex justify-between text-sm mb-1">
									<span>Progress</span>
									<span>{selectedTask.progress}%</span>
								</div>
								<div className="w-full bg-gray-200 rounded-full h-2">
									<div
										className="bg-blue-600 h-2 rounded-full transition-all duration-300"
										style={{ width: `${selectedTask.progress}%` }}
									/>
								</div>
							</div>
						)}

						{/* Conversation Messages */}
						{conversation && conversation.messages.length > 0 && (
							<div>
								<h4 className="font-medium mb-2">Conversation</h4>
								<div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
									{conversation.messages.map(msg => (
										<div key={msg.id} className="flex flex-col space-y-1">
											<div className="flex items-center gap-2 text-xs text-gray-500">
												<span className="font-medium">{msg.agentId}</span>
												<span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
											</div>
											<div className="text-sm bg-gray-100 rounded p-2">{msg.content}</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Send Message */}
						<div className="flex gap-2">
							<input
								type="text"
								value={message}
								onChange={e => setMessage(e.target.value)}
								placeholder="Send a message to the agents..."
								onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
								className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<button
								onClick={sendMessage}
								disabled={sendingMessage || !message.trim()}
								className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
							>
								{sendingMessage ? 'Sending...' : 'Send'}
							</button>
						</div>

						{/* Task Results */}
						{selectedTask.outputs && Object.keys(selectedTask.outputs).length > 0 && (
							<div>
								<h4 className="font-medium mb-2">Results</h4>
								<pre className="bg-gray-100 rounded p-3 text-sm overflow-x-auto">
									{JSON.stringify(selectedTask.outputs, null, 2)}
								</pre>
							</div>
						)}

						{/* Error Display */}
						{selectedTask.error && (
							<div className="bg-red-50 border border-red-200 rounded-md p-4">
								<p className="text-red-800">{selectedTask.error}</p>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
