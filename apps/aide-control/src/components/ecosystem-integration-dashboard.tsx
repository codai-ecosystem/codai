'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { memoraiService } from '@/lib/memorai';
import { codaiAPI } from '@/lib/codai-api';

interface ServiceStatus {
	name: string;
	status: 'connected' | 'disconnected' | 'error';
	lastCheck: Date;
	error?: string;
}

export function EcosystemIntegrationDashboard() {
	const { data: session } = useSession();
	const [services, setServices] = useState<ServiceStatus[]>([
		{ name: 'LogAI Authentication', status: 'disconnected', lastCheck: new Date() },
		{ name: 'MemorAI Memory System', status: 'disconnected', lastCheck: new Date() },
		{ name: 'Codai Central Platform', status: 'disconnected', lastCheck: new Date() },
	]);

	const checkServiceStatus = async () => {
		const updatedServices = [...services];

		// Check LogAI Authentication
		try {
			if (session?.user) {
				updatedServices[0] = {
					name: 'LogAI Authentication',
					status: 'connected',
					lastCheck: new Date(),
				};
			} else {
				updatedServices[0] = {
					name: 'LogAI Authentication',
					status: 'disconnected',
					lastCheck: new Date(),
				};
			}
		} catch (error) {
			updatedServices[0] = {
				name: 'LogAI Authentication',
				status: 'error',
				lastCheck: new Date(),
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}

		// Check MemorAI
		try {
			await memoraiService.getContext(1);
			updatedServices[1] = {
				name: 'MemorAI Memory System',
				status: 'connected',
				lastCheck: new Date(),
			};
		} catch (error) {
			updatedServices[1] = {
				name: 'MemorAI Memory System',
				status: 'error',
				lastCheck: new Date(),
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}

		// Check Codai Central Platform
		try {
			await codaiAPI.getSystemHealth();
			updatedServices[2] = {
				name: 'Codai Central Platform',
				status: 'connected',
				lastCheck: new Date(),
			};
		} catch (error) {
			updatedServices[2] = {
				name: 'Codai Central Platform',
				status: 'error',
				lastCheck: new Date(),
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}

		setServices(updatedServices);
	};

	useEffect(() => {
		checkServiceStatus();
		const interval = setInterval(checkServiceStatus, 30000); // Check every 30 seconds
		return () => clearInterval(interval);
	}, [session]);

	const getStatusColor = (status: ServiceStatus['status']) => {
		switch (status) {
			case 'connected':
				return 'text-green-600 bg-green-100';
			case 'error':
				return 'text-red-600 bg-red-100';
			default:
				return 'text-gray-600 bg-gray-100';
		}
	};

	const getStatusIcon = (status: ServiceStatus['status']) => {
		switch (status) {
			case 'connected':
				return '✅';
			case 'error':
				return '❌';
			default:
				return '⏳';
		}
	};

	return (
		<div className="p-6 bg-white rounded-lg shadow-sm border">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-xl font-semibold text-gray-900">Ecosystem Integration Status</h2>
				<button
					onClick={checkServiceStatus}
					className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
				>
					Refresh Status
				</button>
			</div>

			<div className="space-y-4">
				{services.map((service, index) => (
					<div key={index} className="flex items-center justify-between p-4 border rounded-lg">
						<div className="flex items-center space-x-3">
							<span className="text-lg">{getStatusIcon(service.status)}</span>
							<div>
								<h3 className="font-medium text-gray-900">{service.name}</h3>
								<p className="text-sm text-gray-500">
									Last checked: {service.lastCheck.toLocaleTimeString()}
								</p>
								{service.error && (
									<p className="text-sm text-red-600 mt-1">Error: {service.error}</p>
								)}
							</div>
						</div>
						<span
							className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
								service.status
							)}`}
						>
							{service.status.charAt(0).toUpperCase() + service.status.slice(1)}
						</span>
					</div>
				))}
			</div>

			{session && (
				<div className="mt-6 p-4 bg-green-50 rounded-lg">
					<h3 className="font-medium text-green-900 mb-2">User Session Active</h3>
					<p className="text-sm text-green-700">Authenticated as: {session.user?.email}</p>
				</div>
			)}
		</div>
	);
}
