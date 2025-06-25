import { useState, useCallback } from 'react';

export interface Task {
	id: string;
	title: string;
	description?: string;
	status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
	progress: number; // 0-100
	startTime?: Date;
	endTime?: Date;
	error?: string;
	result?: any;
	subtasks?: Task[];
}

export interface UseTaskProgressReturn {
	tasks: Map<string, Task>;
	getTask: (id: string) => Task | undefined;
	addTask: (task: Omit<Task, 'id'>) => string;
	updateTask: (id: string, updates: Partial<Task>) => void;
	removeTask: (id: string) => void;
	getActiveTasks: () => Task[];
	getCompletedTasks: () => Task[];
	getFailedTasks: () => Task[];
	getTotalProgress: () => number;
}

export function useTaskProgress(): UseTaskProgressReturn {
	const [tasks, setTasks] = useState<Map<string, Task>>(new Map());

	const getTask = useCallback(
		(id: string) => {
			return tasks.get(id);
		},
		[tasks]
	);

	const addTask = useCallback((taskData: Omit<Task, 'id'>) => {
		const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const task: Task = {
			...taskData,
			id,
		};

		setTasks(prev => {
			const newTasks = new Map(prev);
			newTasks.set(id, task);
			return newTasks;
		});

		return id;
	}, []);

	const updateTask = useCallback((id: string, updates: Partial<Task>) => {
		setTasks(prev => {
			const newTasks = new Map(prev);
			const existingTask = newTasks.get(id);
			if (existingTask) {
				const updatedTask = { ...existingTask, ...updates };

				// Auto-set timestamps based on status changes
				if (updates.status === 'running' && !existingTask.startTime) {
					updatedTask.startTime = new Date();
				}
				if (
					(updates.status === 'completed' ||
						updates.status === 'failed' ||
						updates.status === 'cancelled') &&
					!existingTask.endTime
				) {
					updatedTask.endTime = new Date();
				}

				newTasks.set(id, updatedTask);
			}
			return newTasks;
		});
	}, []);

	const removeTask = useCallback((id: string) => {
		setTasks(prev => {
			const newTasks = new Map(prev);
			newTasks.delete(id);
			return newTasks;
		});
	}, []);

	const getActiveTasks = useCallback(() => {
		return Array.from(tasks.values()).filter(
			task => task.status === 'pending' || task.status === 'running'
		);
	}, [tasks]);

	const getCompletedTasks = useCallback(() => {
		return Array.from(tasks.values()).filter(task => task.status === 'completed');
	}, [tasks]);

	const getFailedTasks = useCallback(() => {
		return Array.from(tasks.values()).filter(task => task.status === 'failed');
	}, [tasks]);

	const getTotalProgress = useCallback(() => {
		const allTasks = Array.from(tasks.values());
		if (allTasks.length === 0) return 0;

		const totalProgress = allTasks.reduce((sum, task) => sum + task.progress, 0);
		return Math.round(totalProgress / allTasks.length);
	}, [tasks]);

	return {
		tasks,
		getTask,
		addTask,
		updateTask,
		removeTask,
		getActiveTasks,
		getCompletedTasks,
		getFailedTasks,
		getTotalProgress,
	};
}
