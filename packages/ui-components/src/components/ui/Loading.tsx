import React from 'react';

export interface LoadingProps {
	size?: 'sm' | 'md' | 'lg' | 'xl';
	variant?: 'default' | 'dots' | 'pulse' | 'bars';
	text?: string;
	className?: string;
}

/**
 * Loading component with multiple variants and sizes
 * Provides modern loading animations for CODAI.RO interface
 */
export function Loading({ size = 'md', variant = 'default', text, className = '' }: LoadingProps) {
	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-8 h-8',
		lg: 'w-12 h-12',
		xl: 'w-16 h-16',
	};

	const renderSpinner = () => {
		switch (variant) {
			case 'dots':
				return (
					<div className="flex space-x-1">
						{[0, 1, 2].map(i => (
							<div
								key={i}
								className={`bg-codai-primary rounded-full ${size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'} animate-pulse`}
								style={{ animationDelay: `${i * 0.15}s` }}
							/>
						))}
					</div>
				);

			case 'pulse':
				return (
					<div
						className={`bg-gradient-to-r from-codai-primary to-codai-accent rounded-full ${sizeClasses[size]} animate-pulse`}
					/>
				);

			case 'bars':
				return (
					<div className="flex space-x-1">
						{[0, 1, 2, 3].map(i => (
							<div
								key={i}
								className={`bg-codai-primary ${size === 'sm' ? 'w-1 h-4' : size === 'md' ? 'w-1.5 h-6' : size === 'lg' ? 'w-2 h-8' : 'w-2.5 h-10'} animate-pulse`}
								style={{ animationDelay: `${i * 0.1}s` }}
							/>
						))}
					</div>
				);

			default:
				return (
					<div
						className={`animate-spin rounded-full border-2 border-codai-muted border-t-codai-primary ${sizeClasses[size]}`}
					/>
				);
		}
	};

	return (
		<div className={`flex items-center justify-center ${className}`}>
			<div className="flex flex-col items-center space-y-3">
				{renderSpinner()}
				{text && (
					<p className="text-sm text-codai-muted-foreground font-medium animate-pulse">{text}</p>
				)}
			</div>
		</div>
	);
}

export default Loading;
