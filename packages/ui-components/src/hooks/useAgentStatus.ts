import { useState, useCallback } from 'react';

export interface AgentStatus {
	id: string;
	name: string;
	status: 'idle' | 'thinking' | 'executing' | 'error' | 'offline';
	currentTask?: string;
	progress?: number;
	lastUpdate: Date;
	capabilities: string[];
}

export interface UseAgentStatusReturn {
	agents: Map<string, AgentStatus>;
	getAgent: (id: string) => AgentStatus | undefined;
	updateAgentStatus: (id: string, updates: Partial<AgentStatus>) => void;
	addAgent: (agent: Omit<AgentStatus, 'lastUpdate'>) => void;
	removeAgent: (id: string) => void;
	getActiveAgents: () => AgentStatus[];
}

export function useAgentStatus(): UseAgentStatusReturn {
	const [agents, setAgents] = useState<Map<string, AgentStatus>>(new Map());

	const getAgent = useCallback(
		(id: string) => {
			return agents.get(id);
		},
		[agents]
	);

	const updateAgentStatus = useCallback((id: string, updates: Partial<AgentStatus>) => {
		setAgents(prev => {
			const newAgents = new Map(prev);
			const existingAgent = newAgents.get(id);
			if (existingAgent) {
				newAgents.set(id, {
					...existingAgent,
					...updates,
					lastUpdate: new Date(),
				});
			}
			return newAgents;
		});
	}, []);

	const addAgent = useCallback((agent: Omit<AgentStatus, 'lastUpdate'>) => {
		setAgents(prev => {
			const newAgents = new Map(prev);
			newAgents.set(agent.id, {
				...agent,
				lastUpdate: new Date(),
			});
			return newAgents;
		});
	}, []);

	const removeAgent = useCallback((id: string) => {
		setAgents(prev => {
			const newAgents = new Map(prev);
			newAgents.delete(id);
			return newAgents;
		});
	}, []);

	const getActiveAgents = useCallback(() => {
		return Array.from(agents.values()).filter(agent => agent.status !== 'offline');
	}, [agents]);

	return {
		agents,
		getAgent,
		updateAgentStatus,
		addAgent,
		removeAgent,
		getActiveAgents,
	};
}
