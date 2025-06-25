'use client';

import { useState, useEffect } from 'react';
import { userPreferences, ThemeMode } from '../lib/user-preferences';

/**
 * Example of using the userPreferences utility in a component
 */
export function UserPreferencesExample() {
	// Get initial preferences
	const [theme, setTheme] = useState<ThemeMode>(() => userPreferences.get('theme'));
	const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
		userPreferences.get('sidebarCollapsed')
	);
	const [recentCommands, setRecentCommands] = useState(() => userPreferences.get('recentCommands'));
	const [accessibilitySettings, setAccessibilitySettings] = useState(() =>
		userPreferences.get('accessibilityPreferences')
	);

	// Theme toggle example
	const toggleTheme = () => {
		const newTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
		setTheme(newTheme);
		userPreferences.set('theme', newTheme);
	};

	// Sidebar toggle example
	const toggleSidebar = () => {
		const newState = !sidebarCollapsed;
		setSidebarCollapsed(newState);
		userPreferences.set('sidebarCollapsed', newState);
	};

	// Add command to history example
	const addCommandToHistory = (commandId: string) => {
		userPreferences.addRecentCommand(commandId);
		// Re-fetch the updated commands
		setRecentCommands(userPreferences.get('recentCommands'));
	};

	// Update accessibility settings example
	const toggleReducedMotion = () => {
		const updatedSettings = userPreferences.updateAccessibility({
			reducedMotion: !accessibilitySettings.reducedMotion,
		});
		setAccessibilitySettings(updatedSettings);
	};

	// Reset all preferences example
	const resetAllPreferences = () => {
		userPreferences.reset();
		// Re-fetch all values after reset
		setTheme(userPreferences.get('theme'));
		setSidebarCollapsed(userPreferences.get('sidebarCollapsed'));
		setRecentCommands(userPreferences.get('recentCommands'));
		setAccessibilitySettings(userPreferences.get('accessibilityPreferences'));
	};

	return (
		<div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
			<h2 className="text-xl font-semibold mb-4">User Preferences Example</h2>

			<div className="space-y-6">
				<div>
					<h3 className="text-lg font-medium mb-2">Theme</h3>
					<div className="flex items-center space-x-4">
						<span>Current theme: {theme}</span>
						<button
							onClick={toggleTheme}
							className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
						>
							Toggle Theme
						</button>
					</div>
				</div>

				<div>
					<h3 className="text-lg font-medium mb-2">Sidebar</h3>
					<div className="flex items-center space-x-4">
						<span>Sidebar collapsed: {sidebarCollapsed ? 'Yes' : 'No'}</span>
						<button
							onClick={toggleSidebar}
							className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
						>
							Toggle Sidebar
						</button>
					</div>
				</div>

				<div>
					<h3 className="text-lg font-medium mb-2">Recent Commands</h3>
					{recentCommands.length === 0 ? (
						<p>No recent commands</p>
					) : (
						<ul className="list-disc pl-5">
							{recentCommands.map(cmd => (
								<li key={cmd.id}>
									{cmd.id} - {new Date(cmd.timestamp).toLocaleString()}
								</li>
							))}
						</ul>
					)}
					<div className="mt-2">
						<button
							onClick={() => addCommandToHistory('example-command-' + Date.now())}
							className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
						>
							Add Sample Command
						</button>
					</div>
				</div>

				<div>
					<h3 className="text-lg font-medium mb-2">Accessibility</h3>
					<div className="flex flex-col space-y-2">
						<div className="flex items-center">
							<input
								type="checkbox"
								id="reducedMotion"
								checked={accessibilitySettings.reducedMotion}
								onChange={toggleReducedMotion}
								className="mr-2"
							/>
							<label htmlFor="reducedMotion">Reduced motion</label>
						</div>
						<div>
							<span>Current settings: </span>
							<code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
								{JSON.stringify(accessibilitySettings, null, 2)}
							</code>
						</div>
					</div>
				</div>

				<div className="pt-4 border-t border-gray-200 dark:border-gray-700">
					<button
						onClick={resetAllPreferences}
						className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
					>
						Reset All Preferences
					</button>
				</div>
			</div>
		</div>
	);
}

export default UserPreferencesExample;
