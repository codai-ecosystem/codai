'use client'

import { useAuth } from '../lib/auth-context'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface DashboardStats {
	totalUsers: number;
	activeSubscriptions: number;
	monthlyRevenue: number;
	apiCallsToday: number;
	systemStatus: 'operational' | 'degraded' | 'down';
}

interface RecentActivity {
	id: string;
	type: 'user_signup' | 'subscription_created' | 'payment_succeeded' | 'api_key_created';
	message: string;
	timestamp: string;
	userId?: string;
}

export default function Home() {
	const { user, loading } = useAuth()
	const router = useRouter()
	const [isAdmin, setIsAdmin] = useState(false)
	const [stats, setStats] = useState<DashboardStats>({
		totalUsers: 0,
		activeSubscriptions: 0,
		monthlyRevenue: 0,
		apiCallsToday: 0,
		systemStatus: 'operational'
	})
	const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
	const [isLoadingStats, setIsLoadingStats] = useState(true)

	useEffect(() => {
		// Redirect to login if not authenticated
		if (!loading && !user) {
			router.push('/login')
		}

		// Check if user is admin (example implementation)
		const checkAdminStatus = async () => {
			if (user) {
				// In a real implementation, we would fetch the user profile from Firestore
				// For now, we'll assume the first user is an admin
				setIsAdmin(true)
			}
		}

		if (user) {
			checkAdminStatus()
		}
	}, [user, loading, router])

	// Fetch dashboard statistics
	useEffect(() => {
		const fetchDashboardStats = async () => {
			if (!user) return;

			try {
				setIsLoadingStats(true);

				// Fetch dashboard stats from API
				const response = await fetch('/api/admin/dashboard-stats');
				if (response.ok) {
					const data = await response.json();
					setStats(data.stats);
					setRecentActivity(data.recentActivity || []);
				} else {
					// Mock data for development
					setStats({
						totalUsers: 42,
						activeSubscriptions: 28,
						monthlyRevenue: 1450,
						apiCallsToday: 12847,
						systemStatus: 'operational'
					});
					setRecentActivity([
						{
							id: '1',
							type: 'user_signup',
							message: 'New user registered: john@example.com',
							timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
						},
						{
							id: '2',
							type: 'subscription_created',
							message: 'Pro subscription activated for user123',
							timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString()
						},
						{
							id: '3',
							type: 'payment_succeeded',
							message: 'Payment of $29.99 processed successfully',
							timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString()
						}
					]);
				}
			} catch (error) {
				console.error('Failed to fetch dashboard stats:', error);
			} finally {
				setIsLoadingStats(false);
			}
		};

		if (user && isAdmin) {
			fetchDashboardStats();
		}
	}, [user, isAdmin])
	// Format currency
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
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
			case 'user_signup': return '👤';
			case 'subscription_created': return '💳';
			case 'payment_succeeded': return '✅';
			case 'api_key_created': return '🔑';
			default: return '📝';
		}
	};

	if (loading) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center p-24">
				<div className="text-2xl">Loading...</div>
			</main>
		)
	}

	if (!user) {
		return null // Will redirect to login
	}

	return (
		<main className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<header className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
					<div className="flex justify-between items-center">
						<div>
							<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
								AIDE Control Panel
							</h1>
							<p className="text-gray-600 dark:text-gray-300 mt-1">
								AI-Native Development Environment Administration
							</p>
						</div>
						<div className="flex items-center space-x-4">
							<div className="flex items-center space-x-2">
								<div className={`w-3 h-3 rounded-full ${stats.systemStatus === 'operational' ? 'bg-green-500' :
										stats.systemStatus === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
									}`}></div>
								<span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
									{stats.systemStatus}
								</span>
							</div>
							<span className="text-gray-600 dark:text-gray-300">{user.email}</span>
							<button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
								Sign Out
							</button>
						</div>
					</div>
				</header>

				{/* Dashboard Stats */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
						<div className="flex items-center">
							<div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
								<svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
								</svg>
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Users</p>
								<p className="text-2xl font-semibold text-gray-900 dark:text-white">
									{isLoadingStats ? '...' : stats.totalUsers.toLocaleString()}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
						<div className="flex items-center">
							<div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
								<svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Subscriptions</p>
								<p className="text-2xl font-semibold text-gray-900 dark:text-white">
									{isLoadingStats ? '...' : stats.activeSubscriptions.toLocaleString()}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
						<div className="flex items-center">
							<div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
								<svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
								</svg>
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600 dark:text-gray-300">Monthly Revenue</p>
								<p className="text-2xl font-semibold text-gray-900 dark:text-white">
									{isLoadingStats ? '...' : formatCurrency(stats.monthlyRevenue)}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
						<div className="flex items-center">
							<div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
								<svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
							</div>
							<div className="ml-4">
								<p className="text-sm font-medium text-gray-600 dark:text-gray-300">API Calls Today</p>
								<p className="text-2xl font-semibold text-gray-900 dark:text-white">
									{isLoadingStats ? '...' : stats.apiCallsToday.toLocaleString()}
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Navigation Cards */}
					<div className="lg:col-span-2">
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
							Administration
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<Link href="/users" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow group">
								<div className="flex items-center mb-4">
									<div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
										<svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
										</svg>
									</div>
									<h3 className="text-lg font-medium text-gray-900 dark:text-white ml-3">
										Users
									</h3>
								</div>
								<p className="text-gray-600 dark:text-gray-300">
									Manage users, permissions, and access levels across the platform
								</p>
							</Link>

							<Link href="/api-keys" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow group">
								<div className="flex items-center mb-4">
									<div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
										<svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
										</svg>
									</div>
									<h3 className="text-lg font-medium text-gray-900 dark:text-white ml-3">
										API Keys
									</h3>
								</div>
								<p className="text-gray-600 dark:text-gray-300">
									Configure and manage service credentials and API access tokens
								</p>
							</Link>

							<Link href="/billing" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow group">
								<div className="flex items-center mb-4">
									<div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
										<svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
										</svg>
									</div>
									<h3 className="text-lg font-medium text-gray-900 dark:text-white ml-3">
										Billing
									</h3>
								</div>
								<p className="text-gray-600 dark:text-gray-300">
									Define and manage subscription plans, pricing, and billing cycles
								</p>
							</Link>

							<Link href="/usage" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow group">
								<div className="flex items-center mb-4">
									<div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-800 transition-colors">
										<svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
										</svg>
									</div>
									<h3 className="text-lg font-medium text-gray-900 dark:text-white ml-3">
										Usage Metrics
									</h3>
								</div>
								<p className="text-gray-600 dark:text-gray-300">
									View platform usage statistics and performance analytics
								</p>
							</Link>
						</div>
					</div>

					{/* Recent Activity */}
					<div>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
							Recent Activity
						</h2>
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow">
							<div className="p-6">
								{isLoadingStats ? (
									<div className="text-center py-4">
										<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
									</div>
								) : recentActivity.length > 0 ? (
									<div className="space-y-4">
										{recentActivity.map((activity) => (
											<div key={activity.id} className="flex items-start space-x-3">
												<span className="text-xl">{getActivityIcon(activity.type)}</span>
												<div className="flex-1 min-w-0">
													<p className="text-sm text-gray-900 dark:text-white">
														{activity.message}
													</p>
													<p className="text-xs text-gray-500 dark:text-gray-400">
														{formatRelativeTime(activity.timestamp)}
													</p>
												</div>
											</div>
										))}
									</div>
								) : (
									<p className="text-gray-500 dark:text-gray-400 text-center py-4">
										No recent activity
									</p>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}
