import React from 'react';

export interface MetricCardProps {
	title: string;
	value: string | number;
	change?: {
		value: string;
		type: 'increase' | 'decrease' | 'neutral';
	};
	icon?: React.ReactNode;
	loading?: boolean;
	className?: string;
	onClick?: () => void;
}

/**
 * Metric card component for displaying KPIs and statistics
 * Used in dashboards and analytics views for CODAI.RO
 */
export function MetricCard({
	title,
	value,
	change,
	icon,
	loading = false,
	className = '',
	onClick,
}: MetricCardProps) {
	const isInteractive = Boolean(onClick);

	const changeColors = {
		increase: 'text-green-600 dark:text-green-400',
		decrease: 'text-red-600 dark:text-red-400',
		neutral: 'text-codai-muted-foreground',
	};

	const changeIcons = {
		increase: (
			<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M7 17l9.2-9.2M17 17V7H7"
				/>
			</svg>
		),
		decrease: (
			<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M17 7l-9.2 9.2M7 7v10h10"
				/>
			</svg>
		),
		neutral: null,
	};

	const content = (
		<>
			<div className="flex items-center justify-between">
				<div className="flex-1">
					<p className="text-sm font-medium text-codai-muted-foreground mb-2">{title}</p>
					<p className="text-3xl font-bold text-codai-foreground">
						{loading ? (
							<div className="w-20 h-8 bg-codai-muted/20 rounded animate-pulse" />
						) : typeof value === 'number' ? (
							value.toLocaleString()
						) : (
							value
						)}
					</p>
					{change && !loading && (
						<div className={`flex items-center space-x-1 mt-2 ${changeColors[change.type]}`}>
							{changeIcons[change.type]}
							<span className="text-sm font-medium">{change.value}</span>
						</div>
					)}
				</div>
				{icon && (
					<div className="flex-shrink-0 p-4 bg-gradient-to-br from-codai-primary/10 to-codai-accent/10 rounded-2xl">
						<div className="w-7 h-7 text-codai-primary">{icon}</div>
					</div>
				)}
			</div>
		</>
	);

	if (isInteractive) {
		return (
			<button
				onClick={onClick}
				className={`
					group w-full text-left
					bg-codai-card border border-codai-border/20 rounded-2xl p-6
					hover:shadow-lg hover:shadow-codai-primary/10 hover:border-codai-primary/30
					transition-all duration-300 hover:-translate-y-1
					focus:outline-none focus:ring-2 focus:ring-codai-primary focus:ring-offset-2
					${className}
				`}
			>
				{content}
			</button>
		);
	}

	return (
		<div
			className={`
				bg-codai-card border border-codai-border/20 rounded-2xl p-6
				shadow-sm backdrop-blur-sm
				${className}
			`}
		>
			{content}
		</div>
	);
}

export default MetricCard;
