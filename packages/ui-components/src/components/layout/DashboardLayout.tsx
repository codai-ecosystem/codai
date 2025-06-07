'use client'

import React, { useState, useEffect } from 'react'

interface DashboardLayoutProps {
	children: React.ReactNode;
	user?: {
		email?: string;
		name?: string;
		avatar?: string;
	};
	onSignOut?: () => void;
	currentPath?: string;
	LinkComponent?: React.ComponentType<{ href: string; className?: string; onClick?: () => void; children: React.ReactNode }>;
}

interface NavigationItem {
	name: string;
	href: string;
	icon: React.ReactNode;
	count?: number;
	current?: boolean;
}

const navigation: NavigationItem[] = [
	{
		name: 'Dashboard',
		href: '/',
		icon: (
			<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z" />
			</svg>
		),
	},
	{
		name: 'Users',
		href: '/users',
		icon: (
			<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
			</svg>
		),
	},
	{
		name: 'API Keys',
		href: '/api-keys',
		icon: (
			<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
			</svg>
		),
	},
	{
		name: 'Billing',
		href: '/billing',
		icon: (
			<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
			</svg>
		),
	},
	{
		name: 'Analytics',
		href: '/usage',
		icon: (
			<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
			</svg>
		),
	},
	{
		name: 'Activity',
		href: '/activity',
		icon: (
			<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		),
	},
];

export function DashboardLayout({ children, user, onSignOut, currentPath = '/', LinkComponent = 'a' as any }: DashboardLayoutProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const [darkMode, setDarkMode] = useState(false)

	// Initialize dark mode from localStorage
	useEffect(() => {
		const stored = localStorage.getItem('darkMode')
		if (stored) {
			setDarkMode(JSON.parse(stored))
		} else {
			// Check system preference
			setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches)
		}
	}, [])

	// Apply dark mode to document
	useEffect(() => {
		if (darkMode) {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}
		localStorage.setItem('darkMode', JSON.stringify(darkMode))
	}, [darkMode])
	// Update navigation current state
	const navigationWithCurrent = navigation.map(item => ({
		...item,
		current: currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href))
	}))

	return (
		<div className="h-screen flex overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
			{/* Mobile sidebar backdrop */}
			{sidebarOpen && (
				<div 
					className="fixed inset-0 flex z-40 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				>
					<div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
				</div>
			)}

			{/* Sidebar */}
			<div className={`${
				sidebarOpen ? 'translate-x-0' : '-translate-x-full'
			} fixed inset-y-0 left-0 z-50 w-64 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
				<div className="flex flex-col h-full">
					{/* Logo */}
					<div className="flex items-center justify-between h-16 px-6 border-b border-gray-200/50 dark:border-gray-700/50">
						<div className="flex items-center space-x-3">
							<div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
								<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
								</svg>
							</div>
							<span className="text-lg font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
								CODAI.RO
							</span>
						</div>
						<button
							onClick={() => setSidebarOpen(false)}
							className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					{/* Navigation */}
					<nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
						{navigationWithCurrent.map((item) => {
							const isActive = item.current
							return (							<LinkComponent
								key={item.name}
								href={item.href}
								className={`${
									isActive
										? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
										: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
								} group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl border transition-all duration-200`}
								onClick={() => setSidebarOpen(false)}
							>
									<div className={`${
										isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
									} mr-3 transition-colors duration-200`}>
										{item.icon}
									</div>
									{item.name}									{item.count && (
										<span className={`${
											isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
										} ml-auto inline-block py-1 px-2 text-xs rounded-full`}>
											{item.count}
										</span>
									)}
								</LinkComponent>
							)
						})}
					</nav>

					{/* User section */}
					<div className="flex-shrink-0 border-t border-gray-200/50 dark:border-gray-700/50 p-4">
						{/* Dark mode toggle */}
						<div className="flex items-center justify-between mb-4">
							<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</span>
							<button
								onClick={() => setDarkMode(!darkMode)}
								className={`${
									darkMode ? 'bg-indigo-600' : 'bg-gray-200'
								} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
							>
								<span className={`${
									darkMode ? 'translate-x-6' : 'translate-x-1'
								} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
							</button>
						</div>

						{/* User info */}
						{user && (
							<div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-700/50">
								<div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
									{user.name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-gray-900 dark:text-white truncate">
										{user.name || user.email}
									</p>
									{user.name && (
										<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
											{user.email}
										</p>
									)}
								</div>
								{onSignOut && (
									<button
										onClick={onSignOut}
										className="p-1.5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
										title="Sign out"
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
										</svg>
									</button>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Main content */}
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Mobile header */}
				<div className="lg:hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-3">
					<div className="flex items-center justify-between">
						<button
							onClick={() => setSidebarOpen(true)}
							className="p-2 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
							</svg>
						</button>
						<div className="flex items-center space-x-3">
							<div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
								<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
								</svg>
							</div>
							<span className="text-lg font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
								CODAI.RO
							</span>
						</div>
					</div>
				</div>

				{/* Main content area */}
				<main className="flex-1 overflow-y-auto">
					{children}
				</main>
			</div>
		</div>
	)
}
