import React from 'react';
import { MetricCard } from './ui/MetricCard';
import { Loading } from './ui/Loading';
import { StatusIndicator } from './ui/StatusIndicator';
import { Icons } from './ui/Icons';

export interface DashboardStats {
	totalUsers: number;
	activeSubscriptions: number;
	monthlyRevenue: number;
	apiCallsToday: number;
	systemStatus: 'operational' | 'degraded' | 'down';
}

export interface DashboardOverviewProps {
	stats: DashboardStats;
	loading?: boolean;
	className?: string;
}

/**
 * Dashboard overview component showing key metrics and system status
 * Used on the main dashboard page for CODAI.RO
 */
export function DashboardOverview({
	stats,
	loading = false,
	className = ''
}: DashboardOverviewProps) {
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	};

	const metrics = [
		{
			title: 'Total Users',
			value: stats.totalUsers,
			change: {
				value: '+12% from last month',
				type: 'increase' as const
			},
			icon: <Icons.Users className="text-blue-600" />,
		},
		{
			title: 'Active Subscriptions',
			value: stats.activeSubscriptions,
			change: {
				value: '+8% from last month',
				type: 'increase' as const
			},
			icon: <Icons.CheckCircle className="text-green-600" />,
		},
		{
			title: 'Monthly Revenue',
			value: formatCurrency(stats.monthlyRevenue),
			change: {
				value: '+15% from last month',
				type: 'increase' as const
			},
			icon: <Icons.DollarSign className="text-purple-600" />,
		},
		{
			title: 'API Calls Today',
			value: stats.apiCallsToday,
			change: {
				value: '+23% from yesterday',
				type: 'increase' as const
			},
			icon: <Icons.Lightning className="text-amber-600" />,
		},
	];

	if (loading) {
		return (
			<div className={`space-y-6 ${className}`}>
				<div className="flex items-center justify-between">
					<div className="w-48 h-8 bg-codai-muted/20 rounded animate-pulse" />
					<div className="w-32 h-6 bg-codai-muted/20 rounded animate-pulse" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="bg-codai-card border border-codai-border/20 rounded-2xl p-6">
							<Loading size="lg" text="Loading metrics..." />
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Header with system status */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-codai-foreground mb-2">
						Dashboard Overview
					</h2>
					<p className="text-codai-muted-foreground">
						Monitor your platform performance and key metrics
					</p>
				</div>
				<div className="flex items-center space-x-3 px-4 py-2 bg-codai-card border border-codai-border/20 rounded-xl">
					<StatusIndicator 
						status={stats.systemStatus} 
						showLabel 
						animate 
					/>
				</div>
			</div>

			{/* Metrics grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{metrics.map((metric, index) => (
					<MetricCard
						key={index}
						title={metric.title}
						value={metric.value}
						change={metric.change}
						icon={metric.icon}
						loading={loading}
						className="hover:scale-105"
					/>
				))}
			</div>

			{/* Quick insights */}
			<div className="bg-codai-card border border-codai-border/20 rounded-2xl p-6">
				<h3 className="text-lg font-semibold text-codai-foreground mb-4">
					Quick Insights
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="text-center">
						<div className="text-2xl font-bold text-green-600 mb-1">
							98.5%
						</div>
						<div className="text-sm text-codai-muted-foreground">
							Uptime this month
						</div>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold text-blue-600 mb-1">
							2.3s
						</div>
						<div className="text-sm text-codai-muted-foreground">
							Avg response time
						</div>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold text-purple-600 mb-1">
							4.8/5
						</div>
						<div className="text-sm text-codai-muted-foreground">
							User satisfaction
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default DashboardOverview;
