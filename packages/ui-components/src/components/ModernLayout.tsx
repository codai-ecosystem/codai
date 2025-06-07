import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Navigation } from './ui/Navigation';
import { Icons } from './ui/Icons';

export interface LayoutProps {
	children: React.ReactNode;
	title?: string;
	subtitle?: string;
	headerActions?: React.ReactNode;
	navigationItems?: Array<{
		id: string;
		label: string;
		icon?: React.ReactNode;
		href?: string;
		onClick?: () => void;
		active?: boolean;
		badge?: string | number;
	}>;
	className?: string;
}

/**
 * Modern layout component for CODAI.RO applications
 * Provides responsive navigation with collapsible sidebar
 */
export function ModernLayout({
	children,
	title = 'CODAI.RO',
	subtitle,
	headerActions,
	navigationItems = [],
	className = ''
}: LayoutProps) {
	const [sidebarOpen, setSidebarOpen] = useState(true);

	const defaultNavigationItems = [
		{
			id: 'dashboard',
			label: 'Dashboard',
			icon: <Icons.Chart />,
			href: '/',
			active: true
		},
		{
			id: 'users',
			label: 'Users',
			icon: <Icons.Users />,
			href: '/users'
		},
		{
			id: 'api-keys',
			label: 'API Keys',
			icon: <Icons.Key />,
			href: '/api-keys'
		},
		{
			id: 'billing',
			label: 'Billing',
			icon: <Icons.CreditCard />,
			href: '/billing'
		},
		{
			id: 'analytics',
			label: 'Analytics',
			icon: <Icons.TrendingUp />,
			href: '/analytics'
		},
		{
			id: 'settings',
			label: 'Settings',
			icon: <Icons.Settings />,
			href: '/settings'
		}
	];

	const navItems = navigationItems.length > 0 ? navigationItems : defaultNavigationItems;

	return (
		<div className={`min-h-screen bg-codai-background ${className}`}>
			{/* Header */}			<Header
				title={title}
				{...(subtitle && { subtitle })}
				actions={
					<div className="flex items-center space-x-3">
						{headerActions}
						<button
							onClick={() => setSidebarOpen(!sidebarOpen)}
							className="lg:hidden p-2 rounded-lg hover:bg-codai-accent/10 transition-colors"
							aria-label="Toggle sidebar"
						>
							<Icons.Menu size="md" />
						</button>
					</div>
				}
			/>

			<div className="flex">
				{/* Sidebar */}
				<div className={`
					fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
					transform transition-transform duration-300 ease-in-out
					${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
					lg:block pt-20 lg:pt-0
				`}>
					<Sidebar
						isOpen={sidebarOpen}
						onToggle={() => setSidebarOpen(!sidebarOpen)}
						className="h-screen lg:h-[calc(100vh-80px)]"
					>
						<div className="p-4">
							<Navigation
								items={navItems}
								collapsed={!sidebarOpen}
							/>
						</div>
					</Sidebar>
				</div>

				{/* Mobile overlay */}
				{sidebarOpen && (
					<div
						className="fixed inset-0 bg-black/50 z-40 lg:hidden"
						onClick={() => setSidebarOpen(false)}
					/>
				)}

				{/* Main content */}
				<main className={`
					flex-1 p-6 lg:p-8
					${sidebarOpen ? 'lg:ml-0' : 'lg:ml-0'}
					transition-all duration-300
				`}>
					<div className="max-w-7xl mx-auto">
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}

export default ModernLayout;
