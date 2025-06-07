import { vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Create storage mocks with actual internal storage
const createStorageMock = () => {
	const storage = new Map<string, string>();
	
	return {
		getItem: vi.fn((key: string) => storage.get(key) || null),
		setItem: vi.fn((key: string, value: string) => {
			storage.set(key, String(value));
		}),
		removeItem: vi.fn((key: string) => {
			storage.delete(key);
		}),
		clear: vi.fn(() => {
			storage.clear();
		}),
		length: 0,
		key: vi.fn((index: number) => {
			const keys = Array.from(storage.keys());
			return keys[index] || null;
		}),
		// Internal reference for testing
		_storage: storage,
	};
};

const localStorageMock = createStorageMock();
const sessionStorageMock = createStorageMock();

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock,
	writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
	value: sessionStorageMock,
	writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation(query => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Mock window methods
Object.defineProperty(window, 'getComputedStyle', {
	value: vi.fn(() => ({
		getPropertyValue: vi.fn(() => ''),
	})),
});

Object.defineProperty(window, 'scrollTo', {
	value: vi.fn(),
});

Object.defineProperty(window, 'requestAnimationFrame', {
	value: vi.fn((cb) => setTimeout(cb, 16)),
});

Object.defineProperty(window, 'cancelAnimationFrame', {
	value: vi.fn((id) => clearTimeout(id)),
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
		prefetch: vi.fn(),
	}),
	useSearchParams: () => ({
		get: vi.fn(),
		getAll: vi.fn(),
		has: vi.fn(),
		keys: vi.fn(),
		values: vi.fn(),
		entries: vi.fn(),
		forEach: vi.fn(),
		toString: vi.fn(),
	}),
	usePathname: () => '/',
	useParams: () => ({}),
}));

// Mock user preferences with actual implementation
let mockUserPreferencesStorage: any = {
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

const DEFAULT_PREFERENCES = {
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

// Function to reset mock storage
const resetMockUserPreferences = () => {
	mockUserPreferencesStorage = { ...DEFAULT_PREFERENCES };
};

vi.mock('../lib/user-preferences', () => ({
	userPreferences: {
		getAll: vi.fn(() => mockUserPreferencesStorage),
		get: vi.fn((key: string) => mockUserPreferencesStorage[key]),
		set: vi.fn((key: string, value: any) => {
			mockUserPreferencesStorage = { ...mockUserPreferencesStorage, [key]: value };
			// Mock localStorage storage
			if (typeof window !== 'undefined' && window.localStorage) {
				window.localStorage.setItem('codai_user_preferences', JSON.stringify(mockUserPreferencesStorage));
			}
			return mockUserPreferencesStorage;
		}),
		update: vi.fn((updates: any) => {
			mockUserPreferencesStorage = { ...mockUserPreferencesStorage, ...updates };
			// Mock localStorage storage
			if (typeof window !== 'undefined' && window.localStorage) {
				window.localStorage.setItem('codai_user_preferences', JSON.stringify(mockUserPreferencesStorage));
			}
			return mockUserPreferencesStorage;
		}),
		reset: vi.fn(() => {
			mockUserPreferencesStorage = { ...DEFAULT_PREFERENCES };
			// Mock localStorage storage
			if (typeof window !== 'undefined' && window.localStorage) {
				window.localStorage.removeItem('codai_user_preferences');
			}
			return mockUserPreferencesStorage;
		}),
		addRecentCommand: vi.fn((command: any) => {
			const commandEntry = {
				id: command.id || command,
				timestamp: Date.now()
			};
			const currentCommands = mockUserPreferencesStorage.recentCommands || [];
			// Remove existing command with same ID
			const filtered = currentCommands.filter((cmd: any) => cmd.id !== commandEntry.id);
			// Add new command at start and limit to 10
			mockUserPreferencesStorage.recentCommands = [commandEntry, ...filtered].slice(0, 10);
			// Mock localStorage storage
			if (typeof window !== 'undefined' && window.localStorage) {
				window.localStorage.setItem('codai_user_preferences', JSON.stringify(mockUserPreferencesStorage));
			}
			return mockUserPreferencesStorage.recentCommands;
		}),
		dismissNotification: vi.fn((notificationId: string) => {
			const current = mockUserPreferencesStorage.dismissedNotifications || [];
			if (!current.includes(notificationId)) {
				mockUserPreferencesStorage.dismissedNotifications = [...current, notificationId];
				// Mock localStorage storage
				if (typeof window !== 'undefined' && window.localStorage) {
					window.localStorage.setItem('codai_user_preferences', JSON.stringify(mockUserPreferencesStorage));
				}
			}
			return mockUserPreferencesStorage.dismissedNotifications;
		}),
		isNotificationDismissed: vi.fn((notificationId: string) => {
			const dismissed = mockUserPreferencesStorage.dismissedNotifications || [];
			return dismissed.includes(notificationId);
		}),
		updateAccessibility: vi.fn((updates: any) => {
			mockUserPreferencesStorage.accessibilityPreferences = {
				...mockUserPreferencesStorage.accessibilityPreferences,
				...updates
			};
			// Mock localStorage storage
			if (typeof window !== 'undefined' && window.localStorage) {
				window.localStorage.setItem('codai_user_preferences', JSON.stringify(mockUserPreferencesStorage));
			}
			return mockUserPreferencesStorage.accessibilityPreferences;
		})
	}
}));

// Reset all mocks before each test
beforeEach(() => {
	vi.clearAllMocks();
	
	// Clear localStorage and sessionStorage completely
	localStorageMock._storage.clear();
	sessionStorageMock._storage.clear();
	
	// Reset the mock functions
	localStorageMock.clear.mockClear();
	localStorageMock.getItem.mockClear();
	localStorageMock.setItem.mockClear();
	localStorageMock.removeItem.mockClear();
	sessionStorageMock.clear.mockClear();
	sessionStorageMock.getItem.mockClear();
	sessionStorageMock.setItem.mockClear();	sessionStorageMock.removeItem.mockClear();
		// Reset localStorage (which userPreferences uses internally)
	localStorage.clear();
});
