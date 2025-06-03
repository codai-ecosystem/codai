import React from 'react';

export interface TaskStatusProps {
	status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
	title: string;
	description?: string;
	progress?: number;
	className?: string;
	onRetry?: () => void;
	onCancel?: () => void;
}

export const TaskStatus: React.FC<TaskStatusProps> = ({
	status,
	title,
	description,
	progress,
	className = '',
	onRetry,
	onCancel
}) => {
	const getStatusClasses = () => {
		switch (status) {
			case 'running':
				return 'bg-blue-50 border-blue-200 text-blue-800';
			case 'completed':
				return 'bg-green-50 border-green-200 text-green-800';
			case 'failed':
				return 'bg-red-50 border-red-200 text-red-800';
			case 'cancelled':
				return 'bg-gray-50 border-gray-200 text-gray-800';
			default:
				return 'bg-yellow-50 border-yellow-200 text-yellow-800';
		}
	};

	const getStatusIcon = () => {
		switch (status) {
			case 'running':
				return (
					<svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
				);
			case 'completed':
				return (
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
					</svg>
				);
			case 'failed':
				return (
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
					</svg>
				);
			case 'cancelled':
				return (
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
					</svg>
				);
			default:
				return (
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				);
		}
	};

	return (
		<div className={`border rounded-lg p-4 ${getStatusClasses()} ${className}`}>
			<div className="flex items-start justify-between">
				<div className="flex items-center space-x-2">
					{getStatusIcon()}
					<div>
						<h3 className="font-medium">{title}</h3>
						{description && <p className="text-sm opacity-80 mt-1">{description}</p>}
					</div>
				</div>
				<div className="flex space-x-2">
					{status === 'failed' && onRetry && (
						<button
							onClick={onRetry}
							className="text-xs px-2 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded"
						>
							Retry
						</button>
					)}
					{(status === 'running' || status === 'pending') && onCancel && (
						<button
							onClick={onCancel}
							className="text-xs px-2 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded"
						>
							Cancel
						</button>
					)}
				</div>
			</div>
			{status === 'running' && typeof progress === 'number' && (
				<div className="mt-3">
					<div className="flex justify-between text-xs mb-1">
						<span>Progress</span>
						<span>{Math.round(progress)}%</span>
					</div>
					<div className="w-full bg-white bg-opacity-20 rounded-full h-2">
						<div
							className="bg-white bg-opacity-40 h-2 rounded-full transition-all duration-300"
							style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
						/>
					</div>
				</div>
			)}
		</div>
	);
};
