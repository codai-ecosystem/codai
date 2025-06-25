import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { userPreferences, type UserPreferences } from '../lib/user-preferences';

describe('userPreferences utility', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		window.localStorage.clear();
		// Remove the specific key we use
		window.localStorage.removeItem('codai_user_preferences');
		// Force clear any cached preferences
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Also clear after each test to be extra sure
		window.localStorage.clear();
		window.localStorage.removeItem('codai_user_preferences');
	});

	describe('getAll', () => {
		it('should return default preferences when localStorage is empty', () => {
			const prefs = userPreferences.getAll();

			expect(prefs).toEqual({
				theme: 'system',
				sidebarCollapsed: false,
				recentCommands: [],
				dismissedNotifications: [],
				accessibilityPreferences: {
					reducedMotion: false,
					highContrast: false,
					largeText: false,
				},
			});
		});
		it('should return stored preferences when they exist', () => {
			const mockPrefs: UserPreferences = {
				theme: 'system',
				sidebarCollapsed: false,
				recentCommands: [],
				dismissedNotifications: [],
				accessibilityPreferences: {
					reducedMotion: false,
					highContrast: false,
					largeText: false,
				},
			};

			window.localStorage.setItem('codai_user_preferences', JSON.stringify(mockPrefs));

			const prefs = userPreferences.getAll();
			expect(prefs).toEqual(mockPrefs);
		});
	});
	describe('get', () => {
		it('should get a specific preference', () => {
			const mockPrefs: UserPreferences = {
				theme: 'system',
				sidebarCollapsed: false,
				recentCommands: [],
				dismissedNotifications: [],
				accessibilityPreferences: {
					reducedMotion: false,
					highContrast: false,
					largeText: false,
				},
			};

			window.localStorage.setItem('codai_user_preferences', JSON.stringify(mockPrefs));

			const theme = userPreferences.get('theme');
			expect(theme).toBe('system');

			const sidebarCollapsed = userPreferences.get('sidebarCollapsed');
			expect(sidebarCollapsed).toBe(false);
		});

		it('should return default value if preference does not exist', () => {
			const theme = userPreferences.get('theme');
			expect(theme).toBe('system');
		});
	});

	describe('set', () => {
		it('should set a specific preference', () => {
			userPreferences.set('theme', 'dark');

			const storedPrefs = JSON.parse(window.localStorage.getItem('codai_user_preferences') || '{}');
			expect(storedPrefs.theme).toBe('dark');
		});

		it('should keep other preferences unchanged', () => {
			// Set initial preferences
			userPreferences.set('theme', 'dark');
			userPreferences.set('sidebarCollapsed', true);

			// Update one preference
			userPreferences.set('theme', 'light');

			const prefs = userPreferences.getAll();
			expect(prefs.theme).toBe('light');
			expect(prefs.sidebarCollapsed).toBe(true);
		});
	});
	describe('update', () => {
		it('should update multiple preferences at once', () => {
			userPreferences.update({
				theme: 'light',
				sidebarCollapsed: true,
			});

			const prefs = userPreferences.getAll();
			expect(prefs.theme).toBe('light');
			expect(prefs.sidebarCollapsed).toBe(true);
		});

		it('should return the updated preferences', () => {
			const result = userPreferences.update({
				theme: 'light',
				sidebarCollapsed: false,
			});

			expect(result.theme).toBe('light');
			expect(result.sidebarCollapsed).toBe(false);
		});
	});
	describe('reset', () => {
		it('should reset preferences to default values', () => {
			// Clear localStorage to start fresh
			window.localStorage.clear();
			// Set some non-default preferences first
			userPreferences.set('theme', 'light');
			userPreferences.set('sidebarCollapsed', true);

			// Verify they were set
			const beforePrefs = userPreferences.getAll();
			expect(beforePrefs.theme).toBe('light');
			expect(beforePrefs.sidebarCollapsed).toBe(true);

			// Reset to defaults
			userPreferences.reset();

			// Get fresh preferences after reset
			const prefs = userPreferences.getAll();

			expect(prefs.theme).toBe('system');
			expect(prefs.sidebarCollapsed).toBe(false);
		});
	});

	describe('addRecentCommand', () => {
		it('should add command to recent commands', () => {
			userPreferences.addRecentCommand('test-command');

			const prefs = userPreferences.getAll();
			expect(prefs.recentCommands).toHaveLength(1);
			expect(prefs.recentCommands[0].id).toBe('test-command');
			expect(prefs.recentCommands[0].timestamp).toBeGreaterThan(0);
		});

		it('should avoid duplicate commands', () => {
			userPreferences.addRecentCommand('test-command');
			userPreferences.addRecentCommand('test-command');

			const prefs = userPreferences.getAll();
			expect(prefs.recentCommands).toHaveLength(1);
		});

		it('should limit number of recent commands', () => {
			// Add more than 10 commands
			for (let i = 0; i < 15; i++) {
				userPreferences.addRecentCommand(`command-${i}`);
			}

			const prefs = userPreferences.getAll();
			expect(prefs.recentCommands.length).toBe(10);
			expect(prefs.recentCommands[0].id).toBe('command-14'); // Most recent first
		});
	});

	describe('dismissNotification', () => {
		it('should add notification ID to dismissed list', () => {
			userPreferences.dismissNotification('welcome-banner');

			const prefs = userPreferences.getAll();
			expect(prefs.dismissedNotifications).toContain('welcome-banner');
		});

		it('should avoid duplicate dismissals', () => {
			userPreferences.dismissNotification('welcome-banner');
			userPreferences.dismissNotification('welcome-banner');

			const prefs = userPreferences.getAll();
			expect(prefs.dismissedNotifications.filter(id => id === 'welcome-banner')).toHaveLength(1);
		});
	});

	describe('isNotificationDismissed', () => {
		it('should return true for dismissed notifications', () => {
			userPreferences.dismissNotification('test-notification');

			const isDismissed = userPreferences.isNotificationDismissed('test-notification');
			expect(isDismissed).toBe(true);
		});
		it('should return false for non-dismissed notifications', () => {
			// Don't dismiss any notifications
			const isDismissed = userPreferences.isNotificationDismissed('non-existent-notification');
			expect(isDismissed).toBe(false);
		});
	});
	describe('updateAccessibility', () => {
		it('should update accessibility preferences', () => {
			// Start completely fresh
			window.localStorage.clear();

			userPreferences.updateAccessibility({
				reducedMotion: true,
				highContrast: true,
			});

			const prefs = userPreferences.getAll();
			expect(prefs.accessibilityPreferences.reducedMotion).toBe(true);
			expect(prefs.accessibilityPreferences.highContrast).toBe(true);
			expect(prefs.accessibilityPreferences.largeText).toBe(false); // Should remain default
		});
		it('should return updated accessibility preferences', () => {
			// Start completely fresh
			window.localStorage.clear();
			userPreferences.reset();

			const result = userPreferences.updateAccessibility({
				reducedMotion: true,
				largeText: true,
			});

			expect(result).toEqual({
				reducedMotion: true,
				highContrast: false, // Should remain default
				largeText: true,
			});
		});

		it('should keep existing values when updating partially', () => {
			// Start completely fresh
			window.localStorage.clear();

			// Set initial values
			userPreferences.updateAccessibility({
				reducedMotion: true,
				highContrast: true,
				largeText: true,
			});

			// Update only one value
			userPreferences.updateAccessibility({
				reducedMotion: false,
			});

			const prefs = userPreferences.getAll();
			expect(prefs.accessibilityPreferences.reducedMotion).toBe(false);
			expect(prefs.accessibilityPreferences.highContrast).toBe(true);
			expect(prefs.accessibilityPreferences.largeText).toBe(true);
		});
	});
});
