'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useNotifications } from '../../components/ui/Notifications';
import { CommandPalette, useCommandPalette, CommandItem } from '../../components/ui/CommandPalette';
import {
	HomeIcon,
	CircleStackIcon,
	PuzzlePieceIcon,
	CodeBracketIcon,
	AdjustmentsHorizontalIcon,
	ArrowPathIcon,
	CheckCircleIcon,
	ExclamationTriangleIcon,
	InformationCircleIcon,
	XCircleIcon,
	CommandLineIcon,
} from '@heroicons/react/24/outline';

// Define navigation items
const navigationItems = [
	{
		label: 'Home',
		href: '/',
		icon: <HomeIcon className="h-5 w-5" />,
	},
	{
		label: 'Components',
		href: '/components',
		icon: <PuzzlePieceIcon className="h-5 w-5" />,
		isActive: true,
		subItems: [
			{
				label: 'Notifications',
				href: '/components#notifications',
				icon: <InformationCircleIcon className="h-4 w-4" />,
			},
			{
				label: 'Command Palette',
				href: '/components#command-palette',
				icon: <CommandLineIcon className="h-4 w-4" />,
				isActive: true,
			},
			{
				label: 'Dashboard Layout',
				href: '/components#dashboard-layout',
				icon: <AdjustmentsHorizontalIcon className="h-4 w-4" />,
			},
		],
	},
	{
		label: 'API Documentation',
		href: '/api-docs',
		icon: <CodeBracketIcon className="h-5 w-5" />,
	},
	{
		label: 'Data Models',
		href: '/data-models',
		icon: <CircleStackIcon className="h-5 w-5" />,
	},
];

// Mock user info
const userInfo = {
	name: 'Demo User',
	email: 'demo@codai.ro',
	role: 'Developer',
};

export default function ComponentsPage() {
	const { addNotification } = useNotifications();
	const [loading, setLoading] = useState(false);

	// Function to show demo notifications
	const showNotification = (type: 'success' | 'error' | 'warning' | 'info') => {
		const titles = {
			success: 'Success Notification',
			error: 'Error Notification',
			warning: 'Warning Notification',
			info: 'Information Notification',
		};

		const messages = {
			success: 'This is a success notification example with auto-dismiss after 5 seconds.',
			error: 'This is an error notification example. It will stay visible until dismissed.',
			warning: 'This is a warning notification with action buttons.',
			info: 'This is an information notification with auto-dismiss after 10 seconds.',
		};

		const notification = {
			type,
			title: titles[type],
			message: messages[type],
			duration: type === 'error' ? 0 : type === 'info' ? 10000 : 5000,
		};

		if (type === 'warning') {
			addNotification({
				...notification,
				actions: [
					{
						label: 'Action',
						action: () => console.log('Warning action clicked'),
						variant: 'primary',
					},
					{
						label: 'Dismiss',
						action: () => console.log('Dismissed'),
						variant: 'secondary',
					},
				],
			});
		} else {
			addNotification(notification);
		}
	};

	// Simulate loading state
	const simulateLoading = () => {
		setLoading(true);
		setTimeout(() => {
			setLoading(false);
			addNotification({
				type: 'success',
				title: 'Loading Complete',
				message: 'The simulated operation has completed successfully.',
				duration: 3000,
			});
		}, 2000);
	};

	return (
		<DashboardLayout
			navigationItems={navigationItems}
			userInfo={userInfo}
			pageTitle="UI Components Demo"
			pageDescription="Interactive demonstration of UI components"
			breadcrumbs={[
				{ label: 'Home', href: '/' },
				{ label: 'Components', href: '/components' },
			]}
			isLoading={loading}
		>
			<div className="space-y-12">
				{/* Notifications Section */}
				<section id="notifications">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
						Notifications
					</h2>
					<p className="text-gray-600 dark:text-gray-300 mb-6">
						The notification system supports different types of notifications with customizable
						duration, actions, and automatic dismissal.
					</p>

					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="col-span-2 md:col-span-1">
							<button
								onClick={() => showNotification('success')}
								className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl shadow hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/70 text-green-600 dark:text-green-500"
							>
								<CheckCircleIcon className="h-8 w-8" />
								<span className="font-medium">Success</span>
							</button>
						</div>

						<div className="col-span-2 md:col-span-1">
							<button
								onClick={() => showNotification('error')}
								className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl shadow hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/70 text-red-600 dark:text-red-500"
							>
								<XCircleIcon className="h-8 w-8" />
								<span className="font-medium">Error</span>
							</button>
						</div>

						<div className="col-span-2 md:col-span-1">
							<button
								onClick={() => showNotification('warning')}
								className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl shadow hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/70 text-yellow-600 dark:text-yellow-500"
							>
								<ExclamationTriangleIcon className="h-8 w-8" />
								<span className="font-medium">Warning</span>
							</button>
						</div>

						<div className="col-span-2 md:col-span-1">
							<button
								onClick={() => showNotification('info')}
								className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl shadow hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/70 text-blue-600 dark:text-blue-500"
							>
								<InformationCircleIcon className="h-8 w-8" />
								<span className="font-medium">Info</span>
							</button>
						</div>
					</div>
				</section>

				{/* Command Palette Section */}
				<section id="command-palette">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
						Command Palette
					</h2>
					<p className="text-gray-600 dark:text-gray-300 mb-6">
						The command palette provides quick access to actions and navigation. Press{' '}
						<kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">Ctrl+K</kbd> to
						open.
					</p>

					<div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
						<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
							<div>
								<h3 className="text-lg font-medium text-gray-900 dark:text-white">
									Command Palette Features
								</h3>
								<p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
									Search and execute commands from anywhere in the application
								</p>
							</div>
							<button
								onClick={() =>
									document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
								}
								className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
							>
								<CommandLineIcon className="h-5 w-5" />
								<span>Open Command Palette</span>
							</button>
						</div>

						<div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
							<h4 className="font-medium text-gray-900 dark:text-white mb-2">Available Commands</h4>
							<ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
								<li>Navigation to any section or page</li>
								<li>Theme toggle (light/dark mode)</li>
								<li>Quick actions like toggling the sidebar</li>
								<li>Search functionality</li>
							</ul>
						</div>
					</div>
				</section>

				{/* Dashboard Layout Section */}
				<section id="dashboard-layout">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
						Dashboard Layout Features
					</h2>
					<p className="text-gray-600 dark:text-gray-300 mb-6">
						The dashboard layout provides a responsive, accessible interface with various features.
					</p>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
							<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
								Keyboard Shortcuts
							</h3>
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-gray-600 dark:text-gray-300">Toggle Sidebar</span>
									<kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">
										Ctrl + /
									</kbd>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-gray-600 dark:text-gray-300">Toggle Theme</span>
									<kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">
										Ctrl + .
									</kbd>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-gray-600 dark:text-gray-300">Command Palette</span>
									<kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">
										Ctrl + K
									</kbd>
								</div>
							</div>
						</div>

						<div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
							<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
								Loading States
							</h3>
							<p className="text-gray-600 dark:text-gray-300 mb-4">
								The layout handles loading states elegantly
							</p>
							<button
								onClick={simulateLoading}
								disabled={loading}
								className={`flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
							>
								<ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
								<span>{loading ? 'Loading...' : 'Simulate Loading'}</span>
							</button>
						</div>
					</div>
				</section>
			</div>
		</DashboardLayout>
	);
}
