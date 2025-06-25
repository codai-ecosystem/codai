import React from 'react';

export interface StatusBarProps {
	status?: 'idle' | 'running' | 'error' | 'success';
	message?: string;
	progress?: number;
	actions?: React.ReactNode;
	children?: React.ReactNode;
	className?: string;
}

/**
 * StatusBar component for AIDE interface
 * Shows current application status, progress, and quick actions
 */
export function StatusBar({
	status = 'idle',
	message,
	progress,
	actions,
	children,
	className = '',
}: StatusBarProps) {
	const getStatusIcon = () => {
		switch (status) {
			case 'running':
				return '⟳';
			case 'error':
				return '⚠';
			case 'success':
				return '✓';
			case 'idle':
			default:
				return '●';
		}
	};

	const getStatusColor = () => {
		switch (status) {
			case 'running':
				return 'blue';
			case 'error':
				return 'red';
			case 'success':
				return 'green';
			case 'idle':
			default:
				return 'gray';
		}
	};

	return (
		<footer className={`aide-status-bar ${className}`} role="contentinfo">
			<div className="aide-status-bar-content">
				{' '}
				<div className="aide-status-bar-main">
					<span
						className={`aide-status-indicator status-${status}`}
						aria-label={`Status: ${status}`}
					>
						{getStatusIcon()}
					</span>
					{message && <span className="aide-status-message">{message}</span>}{' '}
					{progress !== undefined && progress >= 0 && progress <= 100 && (
						<div className="aide-status-progress">
							{' '}
							<div
								className="aide-status-progress-bar"
								data-progress={progress}
								role="progressbar"
								aria-label={`Progress: ${progress}%`}
							/>
						</div>
					)}
				</div>
				{children && <div className="aide-status-bar-content-area">{children}</div>}
				{actions && <div className="aide-status-bar-actions">{actions}</div>}
			</div>
		</footer>
	);
}

export default StatusBar;
