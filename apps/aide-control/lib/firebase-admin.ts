/**
 * Firebase Admin SDK Configuration for AIDE Control Panel
 * Provides server-side Firebase functionality for authentication and Firestore operations
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

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
			const credentials = JSON.parse(credentialsString);
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
}
