'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
	Bars3Icon,
	XMarkIcon,
	SunIcon,
	MoonIcon,
	BellIcon,
	ChevronRightIcon,
	HomeIcon,
	QuestionMarkCircleIcon,
	MagnifyingGlassIcon,
	ArrowLeftIcon,
	CommandLineIcon,
	CogIcon,
	ArrowRightIcon,
	ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useNotifications } from '../ui/Notifications';
import { CommandPalette, useCommandPalette, type CommandItem } from '../ui/CommandPalette';
import { userPreferences } from '../../lib/user-preferences';

// Debounce hook for search optimization
const useDebounce = (value: string, delay: number): string => {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
};

interface NavigationItem {
	label: string;
	href: string;
	icon?: React.ReactNode;
	isActive?: boolean;
	subItems?: NavigationItem[];
}

interface BreadcrumbItem {
	label: string;
	href: string;
}

interface DashboardLayoutProps {
	children: React.ReactNode;
	navigationItems: NavigationItem[];
	userInfo?: {
		name: string;
		email: string;
		avatar?: string;
		role?: string;
	};
	onNavigate?: (href: string) => void;
	pageTitle?: string;
	pageDescription?: string;
	breadcrumbs?: BreadcrumbItem[];
	actions?: React.ReactNode;
	showSearch?: boolean;
	onSearch?: (query: string) => void;
	searchPlaceholder?: string;
	isLoading?: boolean;
}

const DashboardLayoutComponent: React.FC<DashboardLayoutProps> = ({
	children,
	navigationItems,
	userInfo,
	onNavigate,
	pageTitle,
	pageDescription,
	breadcrumbs = [],
	actions,
	showSearch = false,
	onSearch,
	searchPlaceholder = 'Search...',
	isLoading = false,
}) => {
	// Initialize sidebar state from user preferences
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
		userPreferences.get('sidebarCollapsed')
	);
	const [expandedItems, setExpandedItems] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [isMobile, setIsMobile] = useState(false);
	const { theme, setTheme } = useTheme();
	const router = useRouter();
	const { addNotification } = useNotifications();

	// Setup command palette
	const commandPalette = useCommandPalette();

	// Debounce search query for better performance
	const debouncedSearchQuery = useDebounce(searchQuery, 300);

	// Trigger search when debounced query changes
	useEffect(() => {
		if (onSearch) {
			onSearch(debouncedSearchQuery);
		}
	}, [debouncedSearchQuery, onSearch]);

	// Save sidebar collapsed state to user preferences
	useEffect(() => {
		userPreferences.set('sidebarCollapsed', sidebarCollapsed);
	}, [sidebarCollapsed]);

	// Use theme from user preferences on initial load
	useEffect(() => {
		const userTheme = userPreferences.get('theme');
		if (userTheme && theme !== userTheme) {
			setTheme(userTheme);
		}
	}, []);
	// Save theme changes to user preferences
	useEffect(() => {
		if (theme && (theme === 'light' || theme === 'dark' || theme === 'system')) {
			userPreferences.set('theme', theme);
		}
	}, [theme]);

	// Check if device is mobile on component mount and window resize
	useEffect(() => {
		const checkIfMobile = () => {
			setIsMobile(window.innerWidth < 1024);
		};

		// Initial check
		checkIfMobile();

		// Add event listener
		window.addEventListener('resize', checkIfMobile);

		// Cleanup
		return () => {
			window.removeEventListener('resize', checkIfMobile);
		};
	}, []);
	// Close sidebar on mobile when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const sidebar = document.getElementById('sidebar');
			if (isMobile && sidebarOpen && sidebar && !sidebar.contains(event.target as Node)) {
				setSidebarOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isMobile, sidebarOpen]);

	// Generate command palette commands from navigation items (memoized for performance)
	const commands = useMemo(() => {
		const commandList: CommandItem[] = [];

		// Navigation commands
		navigationItems.forEach(item => {
			commandList.push({
				id: `nav-${item.label.toLowerCase()}`,
				name: item.label,
				description: `Navigate to ${item.label}`,
				icon: item.icon,
				href: item.href,
				category: 'Navigation',
			});

			// Add sub-items
			if (item.subItems) {
				item.subItems.forEach(subItem => {
					commandList.push({
						id: `nav-${item.label.toLowerCase()}-${subItem.label.toLowerCase()}`,
						name: subItem.label,
						description: `Navigate to ${item.label} > ${subItem.label}`,
						icon: subItem.icon,
						href: subItem.href,
						category: `${item.label}`,
					});
				});
			}
		});

		// System commands
		commandList.push(
			{
				id: 'theme-toggle-light',
				name: 'Switch to Light Mode',
				description: 'Change the dashboard theme to light mode',
				icon: <SunIcon className="h-5 w-5" />,
				action: () => {
					setTheme('light');
					userPreferences.set('theme', 'light');
					addNotification({
						type: 'info',
						title: 'Switched to light mode',
						duration: 2000,
					});
				},
				shortcut: ['Ctrl', 'L'],
				category: 'Preferences',
			},
			{
				id: 'theme-toggle-dark',
				name: 'Switch to Dark Mode',
				description: 'Change the dashboard theme to dark mode',
				icon: <MoonIcon className="h-5 w-5" />,
				action: () => {
					setTheme('dark');
					userPreferences.set('theme', 'dark');
					addNotification({
						type: 'info',
						title: 'Switched to dark mode',
						duration: 2000,
					});
				},
				shortcut: ['Ctrl', 'D'],
				category: 'Preferences',
			},
			{
				id: 'theme-toggle-system',
				name: 'Use System Theme',
				description: 'Use your system preference for light or dark mode',
				icon: <CogIcon className="h-5 w-5" />,
				action: () => {
					setTheme('system');
					userPreferences.set('theme', 'system');
					addNotification({
						type: 'info',
						title: 'Using system theme preference',
						duration: 2000,
					});
				},
				shortcut: ['Ctrl', 'S'],
				category: 'Preferences',
			},
			{
				id: 'toggle-sidebar',
				name: 'Toggle Sidebar Visibility',
				description: 'Show or hide the sidebar navigation',
				icon: <Bars3Icon className="h-5 w-5" />,
				action: () => setSidebarOpen(prev => !prev),
				shortcut: ['Ctrl', '/'],
				category: 'Navigation',
			},
			{
				id: 'toggle-sidebar-collapsed',
				name: sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar',
				description: sidebarCollapsed
					? 'Show full sidebar with labels'
					: 'Show compact sidebar with icons only',
				icon: sidebarCollapsed ? (
					<ArrowRightIcon className="h-5 w-5" />
				) : (
					<ArrowLeftIcon className="h-5 w-5" />
				),
				action: () => {
					setSidebarCollapsed(prev => !prev);
					// User preference is updated via useEffect
				},
				shortcut: ['Ctrl', '\\'],
				category: 'Preferences',
			},
			{
				id: 'reset-preferences',
				name: 'Reset All Preferences',
				description: 'Reset all user preferences to default values',
				icon: <ArrowPathIcon className="h-5 w-5" />,
				action: () => {
					userPreferences.reset();
					// Apply default preferences
					setTheme('system');
					setSidebarCollapsed(false);
					addNotification({
						type: 'info',
						title: 'All preferences have been reset',
						duration: 3000,
					});
				},
				category: 'Preferences',
			}
		);

		return commandList;
	}, [navigationItems, theme, setTheme, addNotification, sidebarCollapsed]);

	// Update command palette when commands change
	useEffect(() => {
		commandPalette.setCommands(commands);
	}, [commands, commandPalette]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Escape to close sidebar on mobile
			if (event.key === 'Escape' && sidebarOpen && isMobile) {
				setSidebarOpen(false);
			}

			// Cmd+/ or Ctrl+/ to toggle sidebar
			if ((event.metaKey || event.ctrlKey) && event.key === '/') {
				event.preventDefault();
				setSidebarOpen(prev => !prev);
			}

			// Cmd+. or Ctrl+. to toggle theme
			if ((event.metaKey || event.ctrlKey) && event.key === '.') {
				event.preventDefault();
				setTheme(theme === 'dark' ? 'light' : 'dark');

				addNotification({
					type: 'info',
					title: `Switched to ${theme === 'dark' ? 'light' : 'dark'} mode`,
					duration: 2000,
				});
			}
		};
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [sidebarOpen, isMobile, theme, setTheme, addNotification]);

	const toggleExpandItem = useCallback((href: string) => {
		setExpandedItems(prevItems =>
			prevItems.includes(href) ? prevItems.filter(item => item !== href) : [...prevItems, href]
		);
	}, []);

	const handleNavigation = useCallback(
		(href: string, hasSubItems = false) => {
			// If the item has sub-items, toggle its expansion instead of navigating
			if (hasSubItems) {
				toggleExpandItem(href);
				return;
			}

			if (onNavigate) {
				onNavigate(href);
			} else {
				router.push(href);
			}

			// Close sidebar on mobile after navigation
			if (isMobile) {
				setSidebarOpen(false);
			}
		},
		[onNavigate, router, isMobile, toggleExpandItem]
	);
	const handleSearch = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (onSearch && searchQuery.trim()) {
				onSearch(searchQuery.trim());
			}
		},
		[onSearch, searchQuery]
	);

	return (
		<div className="h-screen flex bg-gray-50 dark:bg-gray-900">
			{/* Command Palette */}
			<CommandPalette
				commands={commandPalette.commands}
				isOpen={commandPalette.isOpen}
				onClose={commandPalette.close}
			/>
			{/* Mobile sidebar overlay */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
					onClick={() => setSidebarOpen(false)}
					role="dialog"
					aria-modal="true"
					aria-label="Navigation sidebar"
				/>
			)}
			{/* Sidebar */}{' '}
			<div
				id="sidebar"
				className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 shadow-lg transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
					sidebarOpen ? 'translate-x-0' : '-translate-x-full'
				} ${sidebarCollapsed ? 'w-16' : 'w-64'}`}
			>
				<div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
					<div className="flex items-center">
						<div className="flex-shrink-0">
							<div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
								<svg
									className="w-6 h-6 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
									/>
								</svg>
							</div>
						</div>
						<div
							className={`ml-3 transition-opacity duration-200 ${sidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}
						>
							<h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
								CODAI.RO
							</h1>
							<p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Control Panel</p>
						</div>
					</div>
					<div className="flex items-center space-x-1">
						{!isMobile && (
							<button
								className="p-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
								onClick={() => setSidebarCollapsed(prev => !prev)}
								aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
							>
								{sidebarCollapsed ? (
									<ArrowRightIcon className="h-4 w-4" />
								) : (
									<ArrowLeftIcon className="h-4 w-4" />
								)}
							</button>
						)}
						<button
							className="lg:hidden p-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
							onClick={() => setSidebarOpen(false)}
							aria-label="Close sidebar"
						>
							<XMarkIcon className="h-5 w-5" />
						</button>{' '}
					</div>
				</div>

				{/* Search in sidebar */}
				<div
					className={`px-4 mt-4 transition-opacity duration-200 ${sidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}
				>
					<form onSubmit={handleSearch} className="relative">
						<div className="relative">
							<MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
							<input
								type="search"
								placeholder="Search menu..."
								className="w-full py-2 pl-10 pr-4 text-sm bg-gray-100 dark:bg-gray-700/50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-indigo-300 dark:focus:bg-gray-700 dark:focus:border-indigo-700 transition-colors"
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								aria-label="Search menu"
							/>
						</div>
					</form>
				</div>

				{sidebarCollapsed && (
					<div className="flex justify-center mt-4">
						<button
							onClick={() => commandPalette.open()}
							className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
							aria-label="Open command palette"
						>
							<MagnifyingGlassIcon className="h-5 w-5" />
						</button>
					</div>
				)}

				{/* Navigation */}
				<nav
					className="mt-4 px-2 overflow-y-auto h-full pb-32"
					role="navigation"
					aria-label="Main navigation"
				>
					<div className="space-y-1">
						{navigationItems
							.filter(
								item =>
									searchQuery === '' ||
									item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
									item.subItems?.some(sub =>
										sub.label.toLowerCase().includes(searchQuery.toLowerCase())
									)
							)
							.map(item => (
								<React.Fragment key={item.href}>
									<button
										onClick={() => handleNavigation(item.href, !!item.subItems?.length)}
										className={`group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl w-full text-left transition-all duration-200 ${
											item.isActive
												? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-900 shadow-sm dark:from-indigo-900/30 dark:to-purple-900/30 dark:text-indigo-100'
												: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white hover:shadow-sm'
										} ${sidebarCollapsed ? 'justify-center' : ''}`}
										aria-current={item.isActive ? 'page' : undefined}
										aria-expanded={item.subItems ? expandedItems.includes(item.href) : undefined}
										data-testid={`nav-item-${item.label.toLowerCase().replace(/\s/g, '-')}`}
										title={sidebarCollapsed ? item.label : undefined}
									>
										<div
											className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}
										>
											{item.icon && (
												<div className={`flex-shrink-0 h-5 w-5 ${sidebarCollapsed ? '' : 'mr-3'}`}>
													{item.icon}
												</div>
											)}
											{(!sidebarCollapsed || !item.icon) && <span>{item.label}</span>}
										</div>
										{!sidebarCollapsed && item.subItems && item.subItems.length > 0 && (
											<ChevronRightIcon
												className={`h-4 w-4 transition-transform duration-200 ${
													expandedItems.includes(item.href) ? 'rotate-90' : ''
												}`}
											/>
										)}
									</button>

									{/* Sub-items dropdown - only show when not collapsed */}
									{!sidebarCollapsed && item.subItems && item.subItems.length > 0 && (
										<div
											className={`pl-6 mt-1 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${
												expandedItems.includes(item.href) ||
												(searchQuery &&
													item.subItems.some(sub =>
														sub.label.toLowerCase().includes(searchQuery.toLowerCase())
													))
													? 'max-h-96 opacity-100'
													: 'max-h-0 opacity-0'
											}`}
										>
											{item.subItems
												.filter(
													sub =>
														searchQuery === '' ||
														sub.label.toLowerCase().includes(searchQuery.toLowerCase())
												)
												.map(subItem => (
													<button
														key={subItem.href}
														onClick={() => handleNavigation(subItem.href)}
														className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg w-full text-left transition-all duration-200 ${
															subItem.isActive
																? 'text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-900/20'
																: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/30 dark:hover:text-gray-300'
														}`}
														aria-current={subItem.isActive ? 'page' : undefined}
														data-testid={`subnav-item-${subItem.label.toLowerCase().replace(/\s/g, '-')}`}
													>
														{subItem.icon && (
															<div className="mr-2 flex-shrink-0 h-4 w-4">{subItem.icon}</div>
														)}
														{subItem.label}
													</button>
												))}
										</div>
									)}
								</React.Fragment>
							))}
					</div>

					{/* Keyboard shortcuts help */}
					<div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 px-3">
						<div className="mb-4">
							{' '}
							<h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
								Keyboard Shortcuts
							</h3>
							<div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
								<div className="flex items-center justify-between">
									<span>Toggle sidebar</span>
									<kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">
										Ctrl + /
									</kbd>
								</div>
								<div className="flex items-center justify-between">
									<span>Toggle theme</span>
									<kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">
										Ctrl + .
									</kbd>
								</div>
								<div className="flex items-center justify-between">
									<span>Open command palette</span>
									<kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">
										Ctrl + K
									</kbd>
								</div>
							</div>
						</div>

						{/* Help & Support Section */}
						<div>
							<h3
								className="text-xs font-semibold text-gray-500 uppercase tracking-wider"
								id="help-heading"
							>
								Help & Support
							</h3>
							<div className="mt-2 space-y-1" aria-labelledby="help-heading">
								<button
									onClick={() => handleNavigation('/help')}
									className="group flex items-center px-3 py-2 text-sm font-medium rounded-xl w-full text-left transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-300"
								>
									<QuestionMarkCircleIcon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-500 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300" />
									Documentation
								</button>
							</div>
						</div>
					</div>
				</nav>

				{/* User info */}
				{userInfo && (
					<div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								{userInfo.avatar ? (
									<img
										className="h-10 w-10 rounded-full ring-2 ring-indigo-200 dark:ring-indigo-800 transition-shadow duration-200 hover:ring-indigo-300 dark:hover:ring-indigo-700"
										src={userInfo.avatar}
										alt={`${userInfo.name}'s avatar`}
									/>
								) : (
									<div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-sm">
										<span className="text-white text-sm font-semibold">
											{userInfo.name.charAt(0).toUpperCase()}
										</span>
									</div>
								)}
							</div>
							<div className="ml-3 flex-1 min-w-0">
								<p className="text-sm font-semibold text-gray-900 dark:text-white truncate group flex items-center">
									{userInfo.name}
									{userInfo.role && (
										<span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
											{userInfo.role}
										</span>
									)}
								</p>
								<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
									{userInfo.email}
								</p>
							</div>
							<div>
								<button
									onClick={() => handleNavigation('/account')}
									className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700/50 transition-colors"
									aria-label="Account settings"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
										/>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
									</svg>
								</button>
							</div>
						</div>{' '}
					</div>
				)}
			</div>
			{/* Main content */}
			<div
				className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
					!isMobile && sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
				}`}
			>
				{/* Top navigation */}
				<header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 dark:border-gray-700/50">
					<div className="flex items-center justify-between h-16 px-4">
						<div className="flex items-center">
							<button
								className="lg:hidden p-2 mr-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
								onClick={() => setSidebarOpen(true)}
								aria-label="Open sidebar"
								aria-expanded={sidebarOpen}
								aria-controls="sidebar-navigation"
							>
								<Bars3Icon className="h-6 w-6" />
							</button>
							{/* Breadcrumbs */}
							<nav aria-label="Breadcrumb" className="hidden sm:flex">
								<ol className="flex items-center space-x-2">
									<li className="flex items-center">
										<button
											onClick={() => handleNavigation('/')}
											className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
											aria-label="Home"
										>
											<HomeIcon className="h-5 w-5" />
										</button>
									</li>

									{breadcrumbs.map((crumb, index) => (
										<li key={crumb.href} className="flex items-center">
											<ChevronRightIcon className="h-4 w-4 text-gray-400" />
											<button
												onClick={() => handleNavigation(crumb.href)}
												className={`ml-2 text-sm font-medium ${
													index === breadcrumbs.length - 1
														? 'text-gray-900 dark:text-white'
														: 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
												}`}
												aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}
											>
												{crumb.label}
											</button>
										</li>
									))}
								</ol>
							</nav>
							{/* Page title - mobile only */}
							{pageTitle && (
								<h1 className="sm:hidden text-lg font-semibold text-gray-900 dark:text-white ml-2">
									{pageTitle}
								</h1>
							)}{' '}
						</div>

						<div className="flex items-center space-x-3">
							{/* Command palette button */}
							<button
								onClick={commandPalette.open}
								className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-all duration-200 hidden sm:block"
								aria-label="Open command palette (Ctrl+K)"
							>
								<div className="flex items-center space-x-1">
									<CommandLineIcon className="h-5 w-5" />
									<span className="text-sm font-medium">Command</span>
									<kbd className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 rounded">
										Ctrl+K
									</kbd>
								</div>
							</button>

							{/* Notifications button */}
							<button
								className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-all duration-200 relative"
								aria-label="View notifications"
							>
								<BellIcon className="h-5 w-5" />
								<span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
							</button>

							{/* Dark mode toggle */}
							<button
								onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
								className="p-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
								aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
							>
								{theme === 'dark' ? (
									<SunIcon className="h-5 w-5" />
								) : (
									<MoonIcon className="h-5 w-5" />
								)}
							</button>
						</div>
					</div>

					{/* Page title and description for larger screens */}
					{pageTitle && (
						<div className="hidden sm:block border-t border-gray-200 dark:border-gray-700 px-4 py-3">
							<h1 className="text-lg font-semibold text-gray-900 dark:text-white">{pageTitle}</h1>
						</div>
					)}
				</header>

				{/* Main content area */}
				<main
					className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 ease-in-out"
					id="main-content"
					tabIndex={-1}
					role="region"
					aria-label={pageTitle || 'Content area'}
				>
					{' '}
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>
				</main>
			</div>
		</div>
	);
};

export const DashboardLayout = React.memo(DashboardLayoutComponent);

DashboardLayout.displayName = 'DashboardLayout';
