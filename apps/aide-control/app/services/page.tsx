'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ServiceConfig } from '../../lib/types';

interface UserServiceData {
	userId: string;
	email?: string;
	configurations: ServiceConfig[];
	totalUsage: number;
	lastActive: string;
}

export default function ServicesPage() {
	const { user, loading } = useAuth();
	const router = useRouter();
	const [isAdmin, setIsAdmin] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [userServices, setUserServices] = useState<UserServiceData[]>([]);
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		// Redirect to login if not authenticated
		if (!loading && !user) {
			router.push('/login');
		}

		// Check if user is admin
		const checkAdminStatus = async () => {
			if (user) {
				// In a real implementation, we would fetch the user profile from Firestore
				// For now, we'll assume the user is an admin
				setIsAdmin(true);
				setIsLoading(false);

				// Load user services data
				await loadUserServices();
			}
		};

		if (user) {
			checkAdminStatus();
		}
	}, [user, loading, router]);

	const loadUserServices = async () => {
		setRefreshing(true);
		try {
			// This would fetch all user service configurations from the admin API
			// For now, we'll use mock data
			const mockData: UserServiceData[] = [
				{
					userId: 'user-123',
					email: 'john.doe@example.com',
					configurations: [
						{
							id: 'config-1',
							userId: 'user-123',
							mode: 'self-managed' as const,
							serviceType: 'llm',
							providerId: 'openai',
							model: 'gpt-4',
							apiKey: 'sk-***',
							isActive: true,
							createdAt: new Date('2024-01-15'),
							updatedAt: new Date('2024-01-20'),
						},
						{
							id: 'config-2',
							userId: 'user-123',
							mode: 'self-managed' as const,
							serviceType: 'embedding',
							providerId: 'openai',
							model: 'text-embedding-ada-002',
							apiKey: 'sk-***',
							isActive: true,
							createdAt: new Date('2024-01-15'),
							updatedAt: new Date('2024-01-20'),
						},
					],
					totalUsage: 15420,
					lastActive: '2024-01-20T10:30:00Z',
				},
				{
					userId: 'user-456',
					email: 'jane.smith@example.com',
					configurations: [
						{
							id: 'config-3',
							userId: 'user-456',
							mode: 'self-managed' as const,
							serviceType: 'llm',
							providerId: 'anthropic',
							model: 'claude-3-opus',
							apiKey: 'sk-ant-***',
							isActive: true,
							createdAt: new Date('2024-01-10'),
							updatedAt: new Date('2024-01-18'),
						},
					],
					totalUsage: 8750,
					lastActive: '2024-01-18T15:45:00Z',
				},
			];
			setUserServices(mockData);
		} catch (error) {
			console.error('Failed to load user services:', error);
		} finally {
			setRefreshing(false);
		}
	};

	const handleDeactivateConfig = async (userId: string, configId: string) => {
		try {
			// This would call the admin API to deactivate a user's service configuration
			console.log(`Deactivating config ${configId} for user ${userId}`);
			// Update local state
			setUserServices(prev =>
				prev.map(userData => {
					if (userData.userId === userId) {
						return {
							...userData,
							configurations: userData.configurations.map(config =>
								config.id === configId ? { ...config, isActive: false } : config
							),
						};
					}
					return userData;
				})
			);
		} catch (error) {
			console.error('Failed to deactivate configuration:', error);
		}
	};

	if (loading || isLoading) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center p-24">
				<div className="text-2xl">Loading...</div>
			</main>
		);
	}

	if (!user || !isAdmin) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center p-24">
				<div className="text-2xl text-red-600">Access denied</div>
				<p className="mt-4">You do not have permission to access this page.</p>
				<Link href="/" className="mt-4 text-blue-600 hover:underline">
					Return to Dashboard
				</Link>
			</main>
		);
	}

	return (
		<main className="flex min-h-screen flex-col p-8">
			<header className="border-b pb-4 mb-8">
				<div className="flex justify-between items-center">
					<div>
						<Link href="/admin" className="text-blue-600 hover:underline mb-2 inline-block">
							← Back to Admin
						</Link>
						<h1 className="text-4xl font-bold">Service Management</h1>
						<p className="text-gray-600 mt-2">Monitor and manage user service configurations</p>
					</div>
					<button
						onClick={loadUserServices}
						disabled={refreshing}
						className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
					>
						{refreshing ? 'Refreshing...' : 'Refresh'}
					</button>
				</div>
			</header>

			<div className="space-y-6">
				{/* Summary Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
						<div className="text-sm text-gray-500 mb-1">Total Users</div>
						<div className="text-3xl font-bold">{userServices.length}</div>
					</div>
					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
						<div className="text-sm text-gray-500 mb-1">Active Configs</div>
						<div className="text-3xl font-bold">
							{userServices.reduce(
								(sum, user) => sum + user.configurations.filter(c => c.isActive).length,
								0
							)}
						</div>
					</div>
					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
						<div className="text-sm text-gray-500 mb-1">Total Usage</div>
						<div className="text-3xl font-bold">
							{userServices.reduce((sum, user) => sum + user.totalUsage, 0).toLocaleString()}
						</div>
					</div>
					<div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm">
						<div className="text-sm text-gray-500 mb-1">Avg Usage/User</div>
						<div className="text-3xl font-bold">
							{userServices.length > 0
								? Math.round(
										userServices.reduce((sum, user) => sum + user.totalUsage, 0) /
											userServices.length
									).toLocaleString()
								: 0}
						</div>
					</div>
				</div>

				{/* User Services Table */}
				<div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm overflow-hidden">
					<div className="p-6 border-b">
						<h2 className="text-2xl font-semibold">User Service Configurations</h2>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-gray-50 dark:bg-gray-700">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										User
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										Configurations
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										Usage
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										Last Active
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200 dark:divide-gray-600">
								{userServices.map(userData => (
									<React.Fragment key={userData.userId}>
										<tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
											<td className="px-6 py-4 whitespace-nowrap">
												<div>
													<div className="text-sm font-medium text-gray-900 dark:text-gray-100">
														{userData.email || userData.userId}
													</div>
													<div className="text-sm text-gray-500 dark:text-gray-400">
														{userData.userId}
													</div>
												</div>
											</td>
											<td className="px-6 py-4">
												<div className="space-y-1">
													{userData.configurations.map(config => (
														<div key={config.id} className="flex items-center space-x-2">
															<span
																className={`px-2 py-1 rounded-full text-xs ${
																	config.isActive
																		? 'bg-green-100 text-green-800'
																		: 'bg-gray-100 text-gray-800'
																}`}
															>
																{config.providerId}
															</span>
															<span className="text-sm text-gray-600 dark:text-gray-400">
																{config.serviceType} - {config.model}
															</span>
														</div>
													))}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
												{userData.totalUsage.toLocaleString()}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
												{new Date(userData.lastActive).toLocaleDateString()}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<button
													onClick={() =>
														setSelectedUserId(
															selectedUserId === userData.userId ? null : userData.userId
														)
													}
													className="text-blue-600 hover:text-blue-800 text-sm font-medium"
												>
													{selectedUserId === userData.userId ? 'Hide' : 'Manage'}
												</button>
											</td>
										</tr>
										{selectedUserId === userData.userId && (
											<tr>
												<td colSpan={5} className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
													<div className="space-y-4">
														<h4 className="text-lg font-medium">Configuration Details</h4>
														{userData.configurations.map(config => (
															<div
																key={config.id}
																className="border rounded-lg p-4 bg-white dark:bg-gray-800"
															>
																<div className="flex justify-between items-start">
																	<div>
																		<div className="font-medium">
																			{config.providerId} {config.serviceType}
																		</div>
																		<div className="text-sm text-gray-600 dark:text-gray-400">
																			Model: {config.model}
																		</div>
																		<div className="text-sm text-gray-600 dark:text-gray-400">
																			Created: {config.createdAt?.toLocaleDateString()}
																		</div>
																		<div className="text-sm text-gray-600 dark:text-gray-400">
																			Updated: {config.updatedAt?.toLocaleDateString()}
																		</div>
																	</div>
																	<div className="space-x-2">
																		{config.isActive && (
																			<button
																				onClick={() =>
																					handleDeactivateConfig(userData.userId, config.id!)
																				}
																				className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
																			>
																				Deactivate
																			</button>
																		)}
																	</div>
																</div>
															</div>
														))}
													</div>
												</td>
											</tr>
										)}
									</React.Fragment>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</main>
	);
}
