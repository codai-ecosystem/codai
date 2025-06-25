import React from 'react';

export interface StatusIndicatorProps {
	status: 'online' | 'offline' | 'away' | 'busy' | 'operational' | 'degraded' | 'down';
	size?: 'sm' | 'md' | 'lg';
	showLabel?: boolean;
	animate?: boolean;
	className?: string;
}

/**
 * Status indicator component for showing system/user status
 * Used throughout CODAI.RO interface for visual status communication
 */
export function StatusIndicator({
	status,
	size = 'md',
	showLabel = false,
	animate = true,
	className = '',
}: StatusIndicatorProps) {
	const sizeClasses = {
		sm: 'w-2 h-2',
		md: 'w-3 h-3',
		lg: 'w-4 h-4',
	};

	const statusConfig = {
		online: {
			color: 'bg-green-500',
			label: 'Online',
			animate: 'animate-pulse',
		},
		operational: {
			color: 'bg-green-500',
			label: 'Operational',
			animate: 'animate-pulse',
		},
		offline: {
			color: 'bg-gray-400',
			label: 'Offline',
			animate: '',
		},
		away: {
			color: 'bg-yellow-500',
			label: 'Away',
			animate: '',
		},
		busy: {
			color: 'bg-red-500',
			label: 'Busy',
			animate: '',
		},
		degraded: {
			color: 'bg-yellow-500',
			label: 'Degraded',
			animate: 'animate-pulse',
		},
		down: {
			color: 'bg-red-500',
			label: 'Down',
			animate: 'animate-pulse',
		},
	};

	const config = statusConfig[status];

	return (
		<div className={`flex items-center space-x-2 ${className}`}>
			<div className="relative">
				<div
					className={`
						rounded-full
						${sizeClasses[size]}
						${config.color}
						${animate ? config.animate : ''}
					`}
				/>
				{/* Glow effect for active states */}
				{(status === 'online' || status === 'operational') && animate && (
					<div
						className={`
							absolute inset-0 rounded-full
							${config.color}
							opacity-75 animate-ping
						`}
					/>
				)}
			</div>
			{showLabel && (
				<span className="text-sm font-medium text-codai-foreground">{config.label}</span>
			)}
		</div>
	);
}

export default StatusIndicator;
