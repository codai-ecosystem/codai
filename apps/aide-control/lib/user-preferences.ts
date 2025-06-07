'use client'

/**
 * UserPreferences utility for storing and retrieving user preferences
 * Uses localStorage with fallbacks for SSR and incognito mode
 */

export type ThemeMode = 'light' | 'dark' | 'system'

export interface UserPreferences {
	theme: ThemeMode;
	sidebarCollapsed: boolean;
	recentCommands: {
		id: string;
		timestamp: number;
	}[];
	dismissedNotifications: string[];
	accessibilityPreferences: {
		reducedMotion: boolean;
		highContrast: boolean;
		largeText: boolean;
	};
}

const DEFAULT_PREFERENCES: UserPreferences = {
	theme: 'system',
	sidebarCollapsed: false,
	recentCommands: [],
	dismissedNotifications: [],
	accessibilityPreferences: {
		reducedMotion: false,
		highContrast: false,
		largeText: false
	}
};

const STORAGE_KEY = 'codai_user_preferences';
const MAX_RECENT_COMMANDS = 10;

/**
 * Safely accesses localStorage with fallbacks
 */
const safeStorage = {
	get: <T>(key: string, defaultValue: T): T => {
		// Check if running on server or if localStorage is available
		if (typeof window === 'undefined' || !window.localStorage) {
			// Return a deep copy to avoid mutation issues
			return JSON.parse(JSON.stringify(defaultValue));
		}

		try {
			const item = window.localStorage.getItem(key);
			return item ? JSON.parse(item) : JSON.parse(JSON.stringify(defaultValue));
		} catch (error) {
			console.error('Failed to read from localStorage:', error);
			// Return a deep copy to avoid mutation issues
			return JSON.parse(JSON.stringify(defaultValue));
		}
	},

	set: <T>(key: string, value: T): void => {
		if (typeof window === 'undefined' || !window.localStorage) {
			return;
		}

		try {
			window.localStorage.setItem(key, JSON.stringify(value));
		} catch (error) {
			console.error('Failed to write to localStorage:', error);
		}
	}
};

/**
 * User preferences manager for storing and retrieving preferences
 */
export const userPreferences = {
	/**
	 * Get all user preferences
	 */
	getAll: (): UserPreferences => {
		return safeStorage.get<UserPreferences>(STORAGE_KEY, DEFAULT_PREFERENCES);
	},

	/**
	 * Get a specific preference value by key
	 */
	get: <K extends keyof UserPreferences>(key: K): UserPreferences[K] => {
		const preferences = safeStorage.get<UserPreferences>(STORAGE_KEY, DEFAULT_PREFERENCES);
		return preferences[key];
	},

	/**
	 * Set a specific preference value
	 */
	set: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): void => {
		const preferences = safeStorage.get<UserPreferences>(STORAGE_KEY, DEFAULT_PREFERENCES);
		preferences[key] = value;
		safeStorage.set(STORAGE_KEY, preferences);
	},

	/**
	 * Update partial preferences
	 */
	update: (updates: Partial<UserPreferences>): UserPreferences => {
		const preferences = safeStorage.get<UserPreferences>(STORAGE_KEY, DEFAULT_PREFERENCES);
		const updatedPreferences = { ...preferences, ...updates };
		safeStorage.set(STORAGE_KEY, updatedPreferences);
		return updatedPreferences;
	},
	/**
	 * Reset preferences to defaults
	 */
	reset: (): void => {
		// Create a fresh copy of defaults to avoid any mutation issues
		const freshDefaults = JSON.parse(JSON.stringify(DEFAULT_PREFERENCES));
		safeStorage.set(STORAGE_KEY, freshDefaults);
	},

	/**
	 * Add a command to recent commands history
	 */
	addRecentCommand: (commandId: string): void => {
		const preferences = safeStorage.get<UserPreferences>(STORAGE_KEY, DEFAULT_PREFERENCES);
		
		// Remove the command if it already exists to avoid duplicates
		const filteredCommands = preferences.recentCommands.filter(cmd => cmd.id !== commandId);
		
		// Add the command to the beginning of the list
		const updatedCommands = [
			{ id: commandId, timestamp: Date.now() },
			...filteredCommands
		].slice(0, MAX_RECENT_COMMANDS); // Keep only the most recent commands
		
		preferences.recentCommands = updatedCommands;
		safeStorage.set(STORAGE_KEY, preferences);
	},

	/**
	 * Add a notification ID to dismissed notifications
	 */
	dismissNotification: (notificationId: string): void => {
		const preferences = safeStorage.get<UserPreferences>(STORAGE_KEY, DEFAULT_PREFERENCES);
		
		// Add the notification ID if it's not already in the list
		if (!preferences.dismissedNotifications.includes(notificationId)) {
			preferences.dismissedNotifications = [
				...preferences.dismissedNotifications,
				notificationId
			];
			safeStorage.set(STORAGE_KEY, preferences);
		}
	},

	/**
	 * Check if a notification has been dismissed
	 */
	isNotificationDismissed: (notificationId: string): boolean => {
		const preferences = safeStorage.get<UserPreferences>(STORAGE_KEY, DEFAULT_PREFERENCES);
		return preferences.dismissedNotifications.includes(notificationId);
	},

	/**
	 * Update accessibility preferences
	 */
	updateAccessibility: (
		updates: Partial<UserPreferences['accessibilityPreferences']>
	): UserPreferences['accessibilityPreferences'] => {
		const preferences = safeStorage.get<UserPreferences>(STORAGE_KEY, DEFAULT_PREFERENCES);
		preferences.accessibilityPreferences = {
			...preferences.accessibilityPreferences,
			...updates
		};
		safeStorage.set(STORAGE_KEY, preferences);
		return preferences.accessibilityPreferences;
	}
};
