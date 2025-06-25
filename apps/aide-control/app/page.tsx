'use client';

import { useAuth } from '../lib/auth-context';
import { APIClient } from '../lib/api-client';
import { useNotifications } from '../components/ui/Notifications';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { userPreferences } from '../lib/user-preferences';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
	HomeIcon,
	UsersIcon,
	KeyIcon,
	CreditCardIcon,
	ChartBarIcon,
	CogIcon,
	UserCircleIcon,
	ClipboardDocumentListIcon,
	ArrowPathIcon,
	DocumentTextIcon,
	ServerIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
	totalUsers: number;
	activeSubscriptions: number;
	monthlyRevenue: number;
	apiCallsToday: number;
	systemStatus: 'operational' | 'degraded' | 'down';
	lastUpdated?: Date;
}

interface RecentActivity {
	id: string;
	type: 'user_signup' | 'subscription_created' | 'payment_succeeded' | 'api_key_created';
	message: string;
	timestamp: string;
	userId?: string;
}

interface QuickAction {
	id: string;
	title: string;
	description: string;
	href: string;
	icon: React.ReactNode;
	color: string;
	hoverColor: string;
}

export default function Home() {
	const { user, loading } = useAuth();
	const router = useRouter();
	const [isAdmin, setIsAdmin] = useState(false);
	const [stats, setStats] = useState<DashboardStats>({
		totalUsers: 0,
		activeSubscriptions: 0,
		monthlyRevenue: 0,
		apiCallsToday: 0,
		systemStatus: 'operational',
		lastUpdated: new Date(),
	});
	const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
	const [isLoadingStats, setIsLoadingStats] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const { addNotification } = useNotifications();

	// Define navigation items for the dashboard layout
	const navigationItems = [
		{
			label: 'Dashboard',
			href: '/',
			icon: <HomeIcon className="h-5 w-5" />,
			isActive: true,
		},
		{
			label: 'Users',
			href: '/users',
			icon: <UsersIcon className="h-5 w-5" />,
		},
		{
			label: 'API Keys',
			href: '/api-keys',
			icon: <KeyIcon className="h-5 w-5" />,
		},
		{
			label: 'Billing',
			href: '/billing',
			icon: <CreditCardIcon className="h-5 w-5" />,
		},
		{
			label: 'Analytics',
			href: '/analytics',
			icon: <ChartBarIcon className="h-5 w-5" />,
			subItems: [
				{
					label: 'Usage Metrics',
					href: '/analytics/usage',
					icon: <ChartBarIcon className="h-4 w-4" />,
				},
				{
					label: 'Performance',
					href: '/analytics/performance',
					icon: <ServerIcon className="h-4 w-4" />,
				},
			],
		},
		{
			label: 'Documentation',
			href: '/docs',
			icon: <DocumentTextIcon className="h-5 w-5" />,
		},
		{
			label: 'Settings',
			href: '/settings',
			icon: <CogIcon className="h-5 w-5" />,
		},
	];

	// User info for dashboard layout
	const userInfo = user
		? {
				name: user.displayName || user.email?.split('@')[0] || 'User',
				email: user.email || '',
				role: isAdmin ? 'Administrator' : 'User',
			}
		: undefined;
	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Escape to clear search
			if (event.key === 'Escape' && searchQuery) {
				setSearchQuery('');
			}
			// Cmd+R or Ctrl+R to refresh data
			if ((event.metaKey || event.ctrlKey) && event.key === 'r') {
				event.preventDefault();
				refreshDashboardStats();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [searchQuery]);

	useEffect(() => {
		// Redirect to login if not authenticated
		if (!loading && !user) {
			router.push('/login');
		}

		// Check if user is admin (example implementation)
		const checkAdminStatus = async () => {
			if (user) {
				// In a real implementation, we would fetch the user profile from Firestore
				// For now, we'll assume the first user is an admin
				setIsAdmin(true);
			}
		};

		if (user) {
			checkAdminStatus();
		}
	}, [user, loading, router]);

	// Fetch dashboard statistics
	const fetchDashboardStats = useCallback(async () => {
		if (!user) return;

		try {
			setIsLoadingStats(true);

			// Fetch dashboard stats from API
			const response = await fetch('/api/admin/dashboard-stats');
			if (response.ok) {
				const data = await response.json();
				setStats({
					...data.stats,
					lastUpdated: new Date(),
				});
				setRecentActivity(data.recentActivity || []);

				// Show success notification
				addNotification({
					type: 'success',
					title: 'Data refreshed',
					message: 'Dashboard statistics have been updated successfully.',
					duration: 3000,
				});
			} else {
				// Mock data for development
				setStats({
					totalUsers: 42,
					activeSubscriptions: 28,
					monthlyRevenue: 1450,
					apiCallsToday: 12847,
					systemStatus: 'operational',
					lastUpdated: new Date(),
				});
				setRecentActivity([
					{
						id: '1',
						type: 'user_signup',
						message: 'New user registered: john@example.com',
						timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
					},
					{
						id: '2',
						type: 'subscription_created',
						message: 'Pro subscription activated for user123',
						timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
					},
					{
						id: '3',
						type: 'payment_succeeded',
						message: 'Payment of $29.99 processed successfully',
						timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
					},
				]);

				// Show fallback notification
				addNotification({
					type: 'info',
					title: 'Using sample data',
					message: 'Could not connect to the API. Displaying sample data instead.',
					duration: 5000,
				});
			}
		} catch (error) {
			console.error('Failed to fetch dashboard stats:', error);

			// Show error notification
			addNotification({
				type: 'error',
				title: 'Failed to fetch data',
				message: 'Could not retrieve dashboard statistics. Please try again later.',
				duration: 7000,
				actions: [
					{
						label: 'Retry',
						action: fetchDashboardStats,
						variant: 'primary',
					},
				],
			});
		} finally {
			setIsLoadingStats(false);
			setRefreshing(false);
		}
	}, [user, addNotification]);

	// Function to handle manual refresh
	const refreshDashboardStats = () => {
		if (refreshing) return;
		setRefreshing(true);
		fetchDashboardStats();
	};

	// Initial fetch
	useEffect(() => {
		if (user && isAdmin) {
			fetchDashboardStats();
		}
	}, [user, isAdmin, fetchDashboardStats]); // Format currency
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(amount);
	};

	// Format relative time
	const formatRelativeTime = (timestamp: string) => {
		const now = new Date();
		const then = new Date(timestamp);
		const diffInMinutes = Math.floor((now.getTime() - then.getTime()) / (1000 * 60));

		if (diffInMinutes < 1) return 'Just now';
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
		return `${Math.floor(diffInMinutes / 1440)}d ago`;
	};

	// Get activity icon
	const getActivityIcon = (type: RecentActivity['type']) => {
		switch (type) {
			case 'user_signup':
				return '👤';
			case 'subscription_created':
				return '💳';
			case 'payment_succeeded':
				return '✅';
			case 'api_key_created':
				return '🔑';
			default:
				return '📝';
		}
	};

	// Format refresh time
	const formatLastUpdated = (date?: Date) => {
		if (!date) return '';

		const now = new Date();
		const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		if (diffInSeconds < 60) return 'Updated just now';
		if (diffInSeconds < 3600) return `Updated ${Math.floor(diffInSeconds / 60)}m ago`;
		if (diffInSeconds < 86400) return `Updated ${Math.floor(diffInSeconds / 3600)}h ago`;
		return `Updated ${Math.floor(diffInSeconds / 86400)}d ago`;
	};

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="flex flex-col items-center space-y-4">
					<div className="w-16 h-16 border-t-4 border-b-4 border-indigo-600 rounded-full animate-spin"></div>
					<p className="text-lg font-medium text-gray-700 dark:text-gray-300">
						Loading dashboard...
					</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return null; // Will redirect to login
	}

	// Dashboard content
	const DashboardContent = (
		<>
			<div className="flex justify-between items-center mb-8">
				<div className="flex flex-col sm:flex-row sm:items-center gap-4">
					<h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
					<div className="flex items-center">
						<div
							className={`w-2.5 h-2.5 rounded-full ${
								stats.systemStatus === 'operational'
									? 'bg-green-500'
									: stats.systemStatus === 'degraded'
										? 'bg-yellow-500'
										: 'bg-red-500'
							}`}
						></div>
						<span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
							System Status: {stats.systemStatus}
						</span>
					</div>
				</div>
				<div className="flex items-center">
					<span className="hidden md:block text-xs text-gray-500 dark:text-gray-400 mr-2">
						{formatLastUpdated(stats.lastUpdated)}
					</span>
					<button
						onClick={refreshDashboardStats}
						disabled={refreshing || isLoadingStats}
						className={`p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 
							dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 transition-all duration-200
							${refreshing || isLoadingStats ? 'opacity-50 cursor-not-allowed' : ''}`}
						aria-label="Refresh dashboard data"
						title="Refresh dashboard data (Ctrl+R)"
					>
						<ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
					</button>
				</div>
			</div>

			{/* Dashboard Stats */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				{/* Total Users */}
				<div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-md transition-shadow">
					<div className="flex items-center justify-between">
						<div className="flex items-center">
							<div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg">
								<UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Users</p>
								<div className="flex items-baseline">
									<p className="text-2xl font-semibold text-gray-900 dark:text-white">
										{isLoadingStats ? (
											<div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
										) : (
											stats.totalUsers.toLocaleString()
										)}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Active Subscriptions */}
				<div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-md transition-shadow">
					<div className="flex items-center justify-between">
						<div className="flex items-center">
							<div className="p-2 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg">
								<CreditCardIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600 dark:text-gray-300">
									Active Subscriptions
								</p>
								<div className="flex items-baseline">
									<p className="text-2xl font-semibold text-gray-900 dark:text-white">
										{isLoadingStats ? (
											<div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
										) : (
											stats.activeSubscriptions.toLocaleString()
										)}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Monthly Revenue */}
				<div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-md transition-shadow">
					<div className="flex items-center justify-between">
						<div className="flex items-center">
							<div className="p-2 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg">
								<svg
									className="h-6 w-6 text-purple-600 dark:text-purple-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
									/>
								</svg>
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600 dark:text-gray-300">
									Monthly Revenue
								</p>
								<div className="flex items-baseline">
									<p className="text-2xl font-semibold text-gray-900 dark:text-white">
										{isLoadingStats ? (
											<div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
										) : (
											formatCurrency(stats.monthlyRevenue)
										)}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* API Calls Today */}
				<div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-md transition-shadow">
					<div className="flex items-center justify-between">
						<div className="flex items-center">
							<div className="p-2 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-lg">
								<ServerIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600 dark:text-gray-300">
									API Calls Today
								</p>
								<div className="flex items-baseline">
									<p className="text-2xl font-semibold text-gray-900 dark:text-white">
										{isLoadingStats ? (
											<div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
										) : (
											stats.apiCallsToday.toLocaleString()
										)}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Quick Actions and Navigation Cards */}
				<div className="lg:col-span-2 space-y-6">
					{/* Quick Actions */}
					<div>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
							Quick Actions
						</h2>
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
							<button
								onClick={() => router.push('/users/new')}
								className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/70"
							>
								<div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-full">
									<UserCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
								</div>
								<span className="text-sm font-medium text-gray-700 dark:text-gray-200">
									Add User
								</span>
							</button>

							<button
								onClick={() => router.push('/api-keys/new')}
								className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/70"
							>
								<div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-full">
									<KeyIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
								</div>
								<span className="text-sm font-medium text-gray-700 dark:text-gray-200">
									New API Key
								</span>
							</button>

							<button
								onClick={() => router.push('/analytics/usage')}
								className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/70"
							>
								<div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-full">
									<ChartBarIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
								</div>
								<span className="text-sm font-medium text-gray-700 dark:text-gray-200">
									Usage Report
								</span>
							</button>
						</div>
					</div>

					{/* Administration Cards */}
					<div>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
							Administration
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<Link
								href="/users"
								className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-md transition-shadow group"
							>
								<div className="flex items-center mb-4">
									<div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 rounded-lg group-hover:from-blue-100 group-hover:to-blue-200 dark:group-hover:from-blue-800/40 dark:group-hover:to-blue-700/40">
										<UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
									</div>
									<h3 className="text-lg font-medium text-gray-900 dark:text-white ml-3">Users</h3>
								</div>
								<p className="text-gray-600 dark:text-gray-300 text-sm">
									Manage users, permissions, and access levels across the platform
								</p>
								<div className="mt-4 flex items-center text-blue-600 dark:text-blue-400">
									<span className="text-sm font-medium">Manage users</span>
									<svg
										className="ml-1 h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 5l7 7-7 7"
										/>
									</svg>
								</div>
							</Link>

							<Link
								href="/api-keys"
								className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-md transition-shadow group"
							>
								<div className="flex items-center mb-4">
									<div className="p-2 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-800/40 rounded-lg group-hover:from-green-100 group-hover:to-green-200 dark:group-hover:from-green-800/40 dark:group-hover:to-green-700/40">
										<KeyIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
									</div>
									<h3 className="text-lg font-medium text-gray-900 dark:text-white ml-3">
										API Keys
									</h3>
								</div>
								<p className="text-gray-600 dark:text-gray-300 text-sm">
									Configure and manage service credentials and API access tokens
								</p>
								<div className="mt-4 flex items-center text-green-600 dark:text-green-400">
									<span className="text-sm font-medium">Manage API keys</span>
									<svg
										className="ml-1 h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 5l7 7-7 7"
										/>
									</svg>
								</div>
							</Link>

							<Link
								href="/billing"
								className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-md transition-shadow group"
							>
								<div className="flex items-center mb-4">
									<div className="p-2 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/40 dark:to-purple-800/40 rounded-lg group-hover:from-purple-100 group-hover:to-purple-200 dark:group-hover:from-purple-800/40 dark:group-hover:to-purple-700/40">
										<CreditCardIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
									</div>
									<h3 className="text-lg font-medium text-gray-900 dark:text-white ml-3">
										Billing
									</h3>
								</div>
								<p className="text-gray-600 dark:text-gray-300 text-sm">
									Define and manage subscription plans, pricing, and billing cycles
								</p>
								<div className="mt-4 flex items-center text-purple-600 dark:text-purple-400">
									<span className="text-sm font-medium">Manage billing</span>
									<svg
										className="ml-1 h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 5l7 7-7 7"
										/>
									</svg>
								</div>
							</Link>

							<Link
								href="/analytics"
								className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-md transition-shadow group"
							>
								<div className="flex items-center mb-4">
									<div className="p-2 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/40 dark:to-orange-800/40 rounded-lg group-hover:from-orange-100 group-hover:to-orange-200 dark:group-hover:from-orange-800/40 dark:group-hover:to-orange-700/40">
										<ChartBarIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
									</div>
									<h3 className="text-lg font-medium text-gray-900 dark:text-white ml-3">
										Analytics
									</h3>
								</div>
								<p className="text-gray-600 dark:text-gray-300 text-sm">
									View platform usage statistics and performance analytics
								</p>
								<div className="mt-4 flex items-center text-orange-600 dark:text-orange-400">
									<span className="text-sm font-medium">View analytics</span>
									<svg
										className="ml-1 h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 5l7 7-7 7"
										/>
									</svg>
								</div>
							</Link>
						</div>
					</div>
				</div>

				{/* Recent Activity */}
				<div className="space-y-6">
					{/* Activity Feed */}
					<div>
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-semibold text-gray-900 dark:text-white">
								Recent Activity
							</h2>
							<Link
								href="/activity"
								className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
							>
								View all
							</Link>
						</div>

						<div className="bg-white dark:bg-gray-800 rounded-xl shadow">
							<div className="p-5">
								{isLoadingStats ? (
									<div className="space-y-4">
										{[...Array(3)].map((_, i) => (
											<div key={i} className="flex items-start space-x-3">
												<div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
												<div className="flex-1">
													<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
													<div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
												</div>
											</div>
										))}
									</div>
								) : recentActivity.length > 0 ? (
									<div className="space-y-4">
										{recentActivity.map(activity => (
											<div key={activity.id} className="flex items-start space-x-3">
												<div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
													<span className="text-base">{getActivityIcon(activity.type)}</span>
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-sm text-gray-900 dark:text-white font-medium">
														{activity.message}
													</p>
													<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
														{formatRelativeTime(activity.timestamp)}
													</p>
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="text-center py-8">
										<ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
										<p className="mt-4 text-gray-500 dark:text-gray-400">
											No recent activity to display
										</p>
										<p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
											System events will appear here as they occur
										</p>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);

	// Render using the DashboardLayout
	return (
		<DashboardLayout
			navigationItems={navigationItems}
			userInfo={userInfo}
			pageTitle="Dashboard"
			breadcrumbs={[]}
		>
			{DashboardContent}
		</DashboardLayout>
	);
}
