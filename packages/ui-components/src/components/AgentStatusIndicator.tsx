import React, { useEffect, useState } from 'react';
import { Bot, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { AgentRuntime, AgentStatus } from '@aide/agent-runtime';
import { Badge } from './ui/Badge';

interface AgentStatusIndicatorProps {
	agentId: string;
	runtime: AgentRuntime;
	showDetails?: boolean;
	className?: string;
}

/**
 * Shows the current status of an AI agent
 */
export const AgentStatusIndicator: React.FC<AgentStatusIndicatorProps> = ({
	agentId,
	runtime,
	showDetails = false,
	className = '',
}) => {
	const [status, setStatus] = useState<AgentStatus | null>(null);
	const [lastActivity, setLastActivity] = useState<Date | null>(null);

	useEffect(() => {
		const subscription = runtime.status$.subscribe(({ agentId: statusAgentId, status: agentStatus }) => {
			if (statusAgentId === agentId) {
				setStatus(agentStatus);
				setLastActivity(new Date());
			}
		});

		return () => subscription.unsubscribe();
	}, [runtime, agentId]);

	const getAgentName = (agentId: string) => {
		const agentNames: Record<string, string> = {
			'planner': 'Planner',
			'builder': 'Builder',
			'designer': 'Designer',
			'tester': 'Tester',
			'deployer': 'Deployer',
			'history': 'History'
		};
		return agentNames[agentId] || agentId;
	};

	const getStatusIcon = (state?: string) => {
		switch (state) {
			case 'active':
				return <Loader2 className="w-3 h-3 animate-spin text-green-500" />;
			case 'idle':
				return <CheckCircle className="w-3 h-3 text-gray-500" />;
			case 'error':
				return <AlertCircle className="w-3 h-3 text-red-500" />;
			default:
				return <Bot className="w-3 h-3 text-gray-400" />;
		}
	};

	const getStatusColor = (state?: string) => {
		switch (state) {
			case 'active':
				return 'bg-green-500';
			case 'idle':
				return 'bg-gray-500';
			case 'error':
				return 'bg-red-500';
			default:
				return 'bg-gray-400';
		}
	};

	const formatLastActivity = (date: Date | null) => {
		if (!date) return '';
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const seconds = Math.floor(diff / 1000);

		if (seconds < 60) return `${seconds}s ago`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		return `${hours}h ago`;
	};

	if (!status) {
		return null;
	}

	return (
		<div className={`flex items-center space-x-2 ${className}`}>
			<div className="flex items-center space-x-1">
				{getStatusIcon(status.state)}
				<span className="text-xs font-medium">{getAgentName(agentId)}</span>
			</div>

			<Badge
				variant={status.state === 'active' ? 'default' : 'secondary'}
				className="text-xs"
			>
				{status.state || 'unknown'}
			</Badge>

			{showDetails && (
				<>
					{status.currentTask && (
						<span className="text-xs text-muted-foreground truncate max-w-32">
							{status.currentTask}
						</span>
					)}

					{lastActivity && (
						<div className="flex items-center space-x-1 text-xs text-muted-foreground">
							<Clock className="w-3 h-3" />
							<span>{formatLastActivity(lastActivity)}</span>
						</div>
					)}
				</>
			)}

			{/* Activity indicator */}
			<div className="relative">
				<div
					className={`w-2 h-2 rounded-full ${getStatusColor(status.state)}`}
				/>
				{status.state === 'active' && (
					<div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping" />
				)}
			</div>
		</div>
	);
};
