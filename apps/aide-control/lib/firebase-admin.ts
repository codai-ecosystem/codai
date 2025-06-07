/**
 * Firebase Admin SDK Configuration for AIDE Control Panel
 * Provides server-side Firebase functionality for authentication and Firestore operations
 */
// During build time, use local mocks to avoid import errors
// The real modules will be used in runtime environment
let initializeApp, getApps, cert, getAdminAuth, getFirestore;

try {
	// Try to import real Firebase Admin modules
	({ initializeApp, getApps, cert } = require('firebase-admin/app'));
	({ getAuth: getAdminAuth } = require('firebase-admin/auth'));
	({ getFirestore } = require('firebase-admin/firestore'));
} catch (error) {
	console.log('Using Firebase Admin mock modules');
	// Fall back to mock implementations if imports fail
	({ initializeApp, getApps, cert } = require('./mocks/firebase-admin-app'));
	({ getAuth: getAdminAuth } = require('./mocks/firebase-admin-auth'));
	({ getFirestore } = require('./mocks/firebase-admin-firestore'));
}

// Initialize Firebase Admin SDK
let app;
if (getApps().length === 0) {
	// During build time or static generation, skip Firebase initialization to avoid credential issues
	const isBuildTime = process.env.NODE_ENV === 'production' && (!process.env.FIREBASE_ADMIN_CREDENTIALS || process.env.FIREBASE_ADMIN_CREDENTIALS === '');

	if (isBuildTime) {
		// This is likely a build-time execution, create a dummy app
		console.log('Firebase Admin: Using build-time fallback initialization');
		app = initializeApp({
			projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'aide-dev-placeholder',
		});
	} else if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
		// Use service account credentials in production runtime
		try {
			const credentialsString = process.env.FIREBASE_ADMIN_CREDENTIALS.trim();
			if (!credentialsString || credentialsString === '') {
				throw new Error('FIREBASE_ADMIN_CREDENTIALS is empty');
			}

			let credentials;
			try {
				// Try to parse as JSON first
				credentials = JSON.parse(credentialsString);
			} catch (jsonError) {
				// If JSON parsing fails, try base64 decode
				try {
					const decodedString = Buffer.from(credentialsString, 'base64').toString('utf-8');
					credentials = JSON.parse(decodedString);
				} catch (base64Error) {
					throw new Error(`Failed to parse credentials as JSON or base64: ${jsonError.message}`);
				}
			}

			app = initializeApp({
				credential: cert(credentials),
				projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
			});
		} catch (error) {
			console.error('Failed to parse Firebase Admin credentials:', error);
			// During build time, fallback to default initialization
			console.warn('Using fallback Firebase initialization due to credential error');
			app = initializeApp({
				projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'aide-dev-placeholder',
			});
		}
	} else {
		// Development fallback - uses Application Default Credentials
		console.log('Firebase Admin: Using development fallback initialization');
		app = initializeApp({
			projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'aide-dev-placeholder',
		});
	}
} else {
	app = getApps()[0];
}

export const adminAuth = getAdminAuth(app);
export const adminDb = getFirestore(app);

/**
 * Get the Firebase Admin app instance
 * @returns The initialized Firebase Admin app
 * @throws {Error} If the app is not initialized
 */
export function getAdminApp() {
	if (!app) {
		throw new Error('Firebase Admin app not initialized');
	}
	return app;
}

/**
 * Firestore Collections Schema
 * Defines the database structure for the AIDE platform
 */
export const COLLECTIONS = {
	USERS: 'users',
	PROJECTS: 'projects',
	USAGE: 'usage',
	BILLING: 'billing',
	AUDIT_LOGS: 'audit_logs',
	SERVICE_CONFIGS: 'service_configs',
	PLANS: 'plans',
	SESSIONS: 'sessions',
	PAYMENTS: 'payments',
} as const;

/**
 * User document schema
 */
export interface UserDocument {
	uid: string;
	email: string;
	displayName?: string;
	role: 'user' | 'admin' | 'superadmin';
	plan: string;
	createdAt: Date;
	updatedAt: Date;
	lastLoginAt?: Date;
	stripeCustomerId?: string;
	stripeConnectAccountId?: string;
	preferences: {
		theme: 'light' | 'dark' | 'system';
		notifications: boolean;
		language: string;
	};
	limits: {
		tokensPerMonth: number;
		projectsMax: number;
		deploymentsPerMonth: number;
	};
	status: 'active' | 'suspended' | 'pending';
	// Setup and onboarding fields
	setupCompleted?: boolean;
	setupCompletedAt?: Date;
	setupSteps?: {
		profile?: 'pending' | 'in_progress' | 'completed' | 'failed';
		plan?: 'pending' | 'in_progress' | 'completed' | 'failed';
		github?: 'pending' | 'in_progress' | 'completed' | 'failed';
		project?: 'pending' | 'in_progress' | 'completed' | 'failed';
		agent?: 'pending' | 'in_progress' | 'completed' | 'failed';
	};
	githubUsername?: string;
	firstProjectId?: string;
}

/**
 * Project document schema
 */
export interface ProjectDocument {
	id: string;
	userId: string; // owner of the project
	name: string;
	description?: string;
	type: 'web-app' | 'api' | 'static-site' | 'function' | 'other';
	status: 'active' | 'archived' | 'deleted';
	repository: {
		url: string;
		branch: string;
		path: string;
	};
	deployment: {
		status: 'deployed' | 'deploying' | 'failed' | 'not_deployed';
		url: string;
		provider: 'cloud-run' | 'vercel' | 'netlify' | 'firebase';
		lastDeployedAt: Date | null;
		environment: 'development' | 'staging' | 'production';
	};
	settings: {
		buildCommand: string;
		outputDirectory: string;
		environmentVariables: Record<string, string>;
		customDomain: string;
		autoSave: boolean;
		backupFrequency: 'hourly' | 'daily' | 'weekly';
		visibility: 'private' | 'team' | 'public';
	};
	usage: {
		deploymentsThisMonth: number;
		storageUsed: number; // in bytes
		bandwidthUsed: number; // in bytes
		buildMinutesUsed: number;
	};
	createdAt: Date;
	updatedAt: Date;
	lastActivity?: Date;
	stripeProductId?: string; // for billing integration
}

/**
 * Usage tracking document schema
 */
export interface UsageDocument {
	id: string;
	userId: string;
	projectId?: string;
	type: 'api_call' | 'token_usage' | 'deployment' | 'storage';
	service: string; // 'openai', 'stripe', 'firebase', etc.
	amount: number;
	unit: string; // 'tokens', 'requests', 'bytes', etc.
	cost?: number;
	timestamp: Date;
	metadata: Record<string, any>;
}

/**
 * Billing document schema
 */
export interface BillingDocument {
	id: string;
	userId: string;
	planId: string;
	status: 'active' | 'cancelled' | 'past_due' | 'incomplete';
	currentPeriodStart: Date;
	currentPeriodEnd: Date;
	stripeSubscriptionId?: string;
	stripeInvoiceId?: string;
	amount: number;
	currency: string;
	usage: {
		tokens: number;
		requests: number;
		deployments: number;
	};
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Audit log document schema
 */
export interface AuditLogDocument {
	id: string;
	userId: string;
	adminId?: string;
	action: string;
	resource: string;
	resourceId: string;
	details: Record<string, any>;
	ipAddress?: string;
	userAgent?: string;
	timestamp: Date;
}

/**
 * Plan document schema (stored server-side)
 */
export interface PlanDocument {
	id: string;
	name: string;
	description: string;
	price: number;
	currency: string;
	interval: 'month' | 'year';
	features: {
		tokensPerMonth: number;
		projectsMax: number;
		deploymentsPerMonth: number;
		supportLevel: 'community' | 'standard' | 'priority';
		customDomain: boolean;
		whiteLabel: boolean;
	};
	stripePriceId?: string;
	active: boolean;
	order: number;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Verify Firebase ID token and return decoded claims
 * @param token - The Firebase ID token to verify
 * @returns Promise resolving to the decoded token claims
 * @throws {Error} If token verification fails
 */
export async function verifyIdToken(token: string): Promise<any> {
	if (!token || typeof token !== 'string') {
		throw new Error('Invalid token: must be a non-empty string');
	}

	try {
		return await adminAuth.verifyIdToken(token);
	} catch (error) {
		console.error('Error verifying ID token:', error);
		throw new Error('Token verification failed');
	}
}

/**
 * Check if a user has admin privileges
 * @param uid - The user ID to check
 * @returns Promise resolving to true if user is admin, false otherwise
 */
export async function isUserAdmin(uid: string): Promise<boolean> {
	if (!uid || typeof uid !== 'string') {
		return false;
	}

	try {
		const userDoc = await adminDb.collection(COLLECTIONS.USERS).doc(uid).get();
		if (!userDoc.exists) {
			return false;
		}
		const userData = userDoc.data() as UserDocument;
		return userData.role === 'admin' || userData.role === 'superadmin';
	} catch (error) {
		console.error('Error checking admin status:', error);
		return false;
	}
}

/**
 * Utility functions for Firestore operations
 */
export class FirestoreService {
	/**
	 * Get user document by UID
	 */
	static async getUserDocument(uid: string): Promise<UserDocument | null> {
		try {
			const doc = await adminDb.collection(COLLECTIONS.USERS).doc(uid).get();
			return doc.exists ? (doc.data() as UserDocument) : null;
		} catch (error) {
			console.error('Error getting user document:', error);
			throw error;
		}
	}

	/**
	 * Create or update user document
	 */
	static async setUserDocument(uid: string, data: Partial<UserDocument>): Promise<void> {
		try {
			const now = new Date();
			const updateData = {
				...data,
				updatedAt: now,
				...(data.uid ? {} : { createdAt: now }),
			};

			await adminDb.collection(COLLECTIONS.USERS).doc(uid).set(updateData, { merge: true });
		} catch (error) {
			console.error('Error setting user document:', error);
			throw error;
		}
	}

	/**
	 * Log usage event
	 */
	static async logUsage(usage: Omit<UsageDocument, 'id' | 'timestamp'>): Promise<void> {
		try {
			await adminDb.collection(COLLECTIONS.USAGE).add({
				...usage,
				timestamp: new Date(),
			});
		} catch (error) {
			console.error('Error logging usage:', error);
			throw error;
		}
	}

	/**
	 * Log audit event
	 */
	static async logAudit(audit: Omit<AuditLogDocument, 'id' | 'timestamp'>): Promise<void> {
		try {
			await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
				...audit,
				timestamp: new Date(),
			});
		} catch (error) {
			console.error('Error logging audit event:', error);
			throw error;
		}
	}
	/**
	 * Get active plans
	 */
	static async getActivePlans(): Promise<PlanDocument[]> {
		try {
			const snapshot = await adminDb
				.collection(COLLECTIONS.PLANS)
				.where('active', '==', true)
				.orderBy('order')
				.get();

			return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlanDocument));
		} catch (error) {
			console.error('Error getting active plans:', error);
			throw error;
		}
	}

	/**
	 * Get recent audit logs
	 */
	static async getRecentAuditLogs(limit: number = 20): Promise<AuditLogDocument[]> {
		try {
			const snapshot = await adminDb
				.collection(COLLECTIONS.AUDIT_LOGS)
				.orderBy('timestamp', 'desc')
				.limit(limit)
				.get();

			return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLogDocument));
		} catch (error) {
			console.error('Error getting recent audit logs:', error);
			throw error;
		}
	}
}
