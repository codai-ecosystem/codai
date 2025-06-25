/**
 * Firebase Client Configuration for AIDE Control Panel
 * Provides safe Firebase client initialization with fallbacks for static builds
 */
import { initializeApp, getApps } from 'firebase/app';
import {
	getAuth,
	onAuthStateChanged as firebaseOnAuthStateChanged,
	User,
	Auth,
} from 'firebase/auth';

// Determine if we're in a static build environment
const isStaticBuild = process.env.NODE_ENV === 'production' && typeof window === 'undefined';

// Mock configuration for static builds
const mockConfig = {
	apiKey: 'mock-api-key',
	authDomain: 'mock.firebaseapp.com',
	projectId: 'mock-project',
	storageBucket: 'mock-storage.appspot.com',
	messagingSenderId: '123456789',
	appId: '1:123456789:web:abcdef',
};

// Your Firebase configuration
const firebaseConfig = isStaticBuild
	? mockConfig
	: {
			apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
			authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
			projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
			storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
			messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
			appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
			measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
		};

// Initialize Firebase with proper error handling
let app;
try {
	app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
} catch (error) {
	console.warn('Firebase initialization error:', error);
	// Provide a minimal mock implementation for static builds
	app = {
		name: '[DEFAULT]',
		options: mockConfig,
		automaticDataCollectionEnabled: false,
	};
}

// Initialize auth with proper error handling
let auth;
try {
	auth = getAuth(app);
} catch (error) {
	console.warn('Firebase auth initialization error:', error);
	// Provide a minimal mock implementation for static builds
	auth = {
		app,
		name: '[DEFAULT]',
		config: {
			apiKey: mockConfig.apiKey,
			authDomain: mockConfig.authDomain,
		},
		currentUser: null,
	};
}

// Safe auth state monitoring for static builds
const onAuthStateChanged = (auth, callback) => {
	if (isStaticBuild) {
		console.warn('Mock auth: onAuthStateChanged called in static build');
		// Call the callback immediately with null user in static builds
		setTimeout(() => callback(null), 0);
		// Return a no-op unsubscribe function
		return () => {};
	}
	return firebaseOnAuthStateChanged(auth, callback);
};

// Safe custom token sign in - simplified implementation
const signInWithCustomToken = async (token: string) => {
	if (isStaticBuild) {
		console.warn('Mock auth: signInWithCustomToken called in static build');
		return Promise.resolve();
	}

	// For now, return a resolved promise since signInWithCustomToken is not available
	// This function can be implemented later when custom token authentication is needed
	console.warn('signInWithCustomToken: Custom token authentication not implemented');
	return Promise.resolve();
};

export { app, auth, onAuthStateChanged, signInWithCustomToken };
