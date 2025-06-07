'use client'

import React, { useState, useEffect, Fragment, useMemo, useCallback } from 'react'
import { Dialog, Combobox, Transition } from '@headlessui/react'
import { MagnifyingGlassIcon, CommandLineIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { userPreferences } from '../../lib/user-preferences'

// Custom hook for debounced value
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

export interface CommandItem {
	id: string;
	name: string;
	description?: string;
	icon?: React.ReactNode;
	href?: string;
	shortcut?: string[];
	action?: () => void;
	category?: string;
}

interface CommandPaletteProps {
	commands: CommandItem[];
	isOpen: boolean;
	onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = React.memo(({
	commands,
	isOpen, 
	onClose
}) => {
	const [query, setQuery] = useState('')
	const router = useRouter()
	
	// Debounce search query for better performance
	const debouncedQuery = useDebounce(query, 150);
	
	// Get recent commands from user preferences (memoized)
	const recentCommands = useMemo(() => {
		const history = userPreferences.get('recentCommands');
		// Map recent command IDs to actual command objects
		return history
			.map(recent => {
				const command = commands.find(cmd => cmd.id === recent.id);
				return command ? { ...command, lastUsed: recent.timestamp } : null;
			})
			.filter(Boolean) as (CommandItem & { lastUsed: number })[];
	}, [commands, isOpen]); // Re-compute when commands change or dialog opens
	
	// Filter commands based on debounced query (memoized)
	const filteredCommands = useMemo(() => {
		if (debouncedQuery === '') return commands;
		
		const lowercaseQuery = debouncedQuery.toLowerCase();
		return commands.filter((command) => {
			return command.name.toLowerCase().includes(lowercaseQuery) || 
				command.description?.toLowerCase().includes(lowercaseQuery) ||
				command.category?.toLowerCase().includes(lowercaseQuery)
		});
	}, [commands, debouncedQuery]);
	
	// Group commands by category (memoized)
	const groupedCommands = useMemo(() => {
		return filteredCommands.reduce((acc, command) => {
			const category = command.category || 'General'
			if (!acc[category]) {
				acc[category] = []
			}
			acc[category].push(command)
			return acc
		}, {} as Record<string, CommandItem[]>);
	}, [filteredCommands]);
	
	// Handle command execution (useCallback for stable reference)
	const executeCommand = useCallback((command: CommandItem) => {
		// Save command to recent history
		userPreferences.addRecentCommand(command.id);
		
		onClose()
		if (command.action) {
			command.action()
		} else if (command.href) {
			router.push(command.href)
		}
	}, [onClose, router]);
	
	// Handle query change (useCallback for stable reference)
	const handleQueryChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		setQuery(event.target.value);
	}, []);
	
	// Reset query when dialog opens
	useEffect(() => {
		if (isOpen) {
			setQuery('')
		}
	}, [isOpen])

	return (
		<Transition.Root show={isOpen} as={Fragment} afterLeave={() => setQuery('')}>
			<Dialog as="div" className="relative z-50" onClose={onClose}>
				{/* Backdrop */}
				<Transition.Child
					as={Fragment}
					enter="ease-out duration-300"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-200"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="fixed inset-0 bg-gray-500 bg-opacity-25 backdrop-blur-sm dark:bg-gray-900 dark:bg-opacity-50 transition-opacity" />
				</Transition.Child>
				
				<div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
					<Transition.Child
						as={Fragment}
						enter="ease-out duration-300"
						enterFrom="opacity-0 scale-95"
						enterTo="opacity-100 scale-100"
						leave="ease-in duration-200"
						leaveFrom="opacity-100 scale-100"
						leaveTo="opacity-0 scale-95"
					>
						<Dialog.Panel className="mx-auto max-w-2xl transform divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
							<Combobox onChange={executeCommand}>
								<div className="relative">
									<MagnifyingGlassIcon
										className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-500 dark:text-gray-400"
										aria-hidden="true"
									/>									<Combobox.Input
										className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-0 sm:text-sm focus:outline-none"
										placeholder="Search commands..."
										aria-label="Search commands"
										onChange={handleQueryChange}
										autoComplete="off"
										autoFocus
									/>
								</div>

								{filteredCommands.length > 0 && (
									<Combobox.Options static className="max-h-80 scroll-py-2 divide-y divide-gray-200 dark:divide-gray-700 overflow-y-auto">
										{/* Recent Commands Section */}
										{debouncedQuery === '' && recentCommands.length > 0 && (
											<li className="p-2">
												<h2 className="mb-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center">
													<ClockIcon className="h-4 w-4 mr-1" />
													Recent Commands
												</h2>
												<ul className="text-sm text-gray-700 dark:text-gray-300">
													{recentCommands.slice(0, 5).map((command) => (
														<Combobox.Option
															key={`recent-${command.id}`}
															value={command}
															className={({ active }: { active: boolean }) =>
																`cursor-pointer select-none rounded-lg px-3 py-2 ${
																	active ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
																}`
															}
														>
															{({ active }: { active: boolean }) => (
																<>
																	<div className="flex items-center justify-between">
																		<div className="flex items-center">
																			{command.icon && (
																				<span className="flex-shrink-0 mr-2">
																					{command.icon}
																				</span>
																			)}
																			<span className="font-medium">{command.name}</span>
																		</div>
																		<div className="text-xs text-gray-400">
																			{new Date(command.lastUsed).toLocaleDateString()}
																		</div>
																	</div>
																</>
															)}
														</Combobox.Option>
													))}
												</ul>
											</li>
										)}
										
										{/* All Commands Grouped by Category */}
										{Object.entries(groupedCommands).map(([category, items]) => (
											<li key={category} className="p-2">
												<h2 className="mb-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
													{category}
												</h2>
												<ul className="text-sm text-gray-700 dark:text-gray-300">
													{items.map((command) => (
														<Combobox.Option
															key={command.id}
															value={command}
															className={({ active }: { active: boolean }) =>
																`cursor-pointer select-none rounded-lg px-3 py-2 ${
																	active ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
																}`
															}
														>
															{({ active }: { active: boolean }) => (
																<>
																	<div className="flex items-center justify-between">
																		<div className="flex items-center">
																			{command.icon && (
																				<span className="flex-shrink-0 mr-2">
																					{command.icon}
																				</span>
																			)}
																			<span className="font-medium">{command.name}</span>
																		</div>
																		{command.shortcut && (
																			<div className="flex items-center ml-2">
																				{command.shortcut.map((key, index) => (
																					<React.Fragment key={index}>
																						{index > 0 && <span className="mx-1 text-xs text-gray-500 dark:text-gray-400">+</span>}
																						<kbd className={`px-1.5 py-0.5 text-xs rounded ${
																							active 
																								? 'bg-indigo-500 text-indigo-100' 
																								: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
																						}`}>
																							{key}
																						</kbd>
																					</React.Fragment>
																				))}
																			</div>
																		)}
																	</div>
																	{command.description && (
																		<div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
																			{command.description}
																		</div>
																	)}
																</>
															)}
														</Combobox.Option>
													))}
												</ul>
											</li>
										))}
									</Combobox.Options>
								)}

								{debouncedQuery !== '' && filteredCommands.length === 0 && (
									<div className="px-6 py-14 text-center text-sm sm:px-14">
										<CommandLineIcon
											className="mx-auto h-6 w-6 text-gray-400 dark:text-gray-500"
											aria-hidden="true"
										/>
										<p className="mt-4 font-semibold text-gray-900 dark:text-white">No commands found</p>
										<p className="mt-2 text-gray-500 dark:text-gray-400">
											No commands match "{query}". Try a different search term.
										</p>
									</div>
								)}
							</Combobox>
						</Dialog.Panel>
					</Transition.Child>
				</div>
			</Dialog>
		</Transition.Root>
	)
});

CommandPalette.displayName = 'CommandPalette';

export function useCommandPalette(initialCommands: CommandItem[] = []) {
	const [isOpen, setIsOpen] = useState(false)
	const [commands, setCommands] = useState<CommandItem[]>(initialCommands)
	
	// Initialize commands from user preferences
	useEffect(() => {
		// Update commands when initial commands change
		if (initialCommands.length > 0) {
			setCommands(initialCommands)
		}
	}, [initialCommands])
	
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault()
				setIsOpen(true)
			}
		}
		
		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [])
	
	const open = () => setIsOpen(true)
	const close = () => setIsOpen(false)
	
	// Add a command with recent history tracking
	const addCommand = (command: CommandItem) => {
		setCommands(prev => {
			// If command already exists, don't add it again
			if (prev.some(c => c.id === command.id)) return prev
			return [...prev, command]
		})
	}
	
	// Execute a command and record it in history
	const executeCommand = (command: CommandItem) => {
		userPreferences.addRecentCommand(command.id)
		
		if (command.action) {
			command.action()
		} else if (command.href && typeof window !== 'undefined') {
			window.location.href = command.href
		}
	}
	
	return {
		isOpen,
		open,
		close,
		commands,
		setCommands,
		addCommand,
		executeCommand
	}
}
