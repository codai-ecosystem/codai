import React from 'react';

export interface AgentIndicatorProps {
	agentName: string;
	status: 'active' | 'idle' | 'working' | 'error';
	activity?: string;
	className?: string;
	showActivity?: boolean;
}

export const AgentIndicator: React.FC<AgentIndicatorProps> = ({
	agentName,
	status,
	activity,
	className = '',
	showActivity = true,
}) => {
	const getStatusClasses = () => {
		switch (status) {
			case 'active':
				return 'bg-green-500';
			case 'working':
				return 'bg-blue-500';
			case 'error':
				return 'bg-red-500';
			default:
				return 'bg-gray-400';
		}
	};

	const getStatusText = () => {
		switch (status) {
			case 'active':
				return 'Active';
			case 'working':
				return 'Working';
			case 'error':
				return 'Error';
			default:
				return 'Idle';
		}
	};

	return (
		<div className={`flex items-center space-x-2 ${className}`}>
			<div className="relative">
				<div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
					<span className="text-xs font-medium text-gray-600">
						{agentName.slice(0, 2).toUpperCase()}
					</span>
				</div>
				<div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStatusClasses()}`}>
					{status === 'working' && <div className="w-full h-full rounded-full animate-pulse" />}
				</div>
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center space-x-2">
					<span className="text-sm font-medium text-gray-900">{agentName}</span>
					<span className="text-xs text-gray-500">{getStatusText()}</span>
				</div>
				{showActivity && activity && <p className="text-xs text-gray-600 truncate">{activity}</p>}
			</div>
		</div>
	);
};
