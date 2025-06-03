import { LLMService, createLLMService } from './llm-service';
import { EmbeddingService, createEmbeddingService } from './embedding-service';
import { ServiceConfig, ServiceType, UsageRecord } from '../types';

// Firebase Admin SDK - will be available in production
interface FirebaseAdmin {
	firestore(): any;
	apps: any[];
	initializeApp(config: any): any;
	credential: { cert(serviceAccount: any): any };
}

interface FirebaseFieldValue {
	increment(value: number): any;
}

// Conditional imports for Firebase Admin
let admin: FirebaseAdmin | null = null;
let FieldValue: FirebaseFieldValue | null = null;

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
	if (typeof window !== 'undefined') {
		// Client-side - not supported
		return false;
	}
	try {
		// Try to require firebase-admin
		admin = require('firebase-admin') as FirebaseAdmin;
		const firestore = require('firebase-admin/firestore');
		FieldValue = firestore.FieldValue as FirebaseFieldValue;

		if (admin.apps.length === 0) {
			if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
				const serviceAccount = JSON.parse(
					Buffer.from(process.env.FIREBASE_ADMIN_CREDENTIALS, 'base64').toString()
				);

				admin.initializeApp({
					credential: admin.credential.cert(serviceAccount),
					projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
				});
			} else {
				// Fallback for development
				admin.initializeApp({
					projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
				});
			}
		}
		return true;
	} catch (error) {
		console.warn('Firebase Admin SDK not available:', error);
		return false;
	}
};

/**
 * ServiceManager coordinates all AI services in the AIDE platform
 * Supports both managed (platform-hosted) and self-managed (user API keys) modes
 */
export class ServiceManager {
	private llmServices: Map<string, LLMService> = new Map();
	private embeddingServices: Map<string, EmbeddingService> = new Map();
	private static instance: ServiceManager;

	private constructor() {}

	static getInstance(): ServiceManager {
		if (!ServiceManager.instance) {
			ServiceManager.instance = new ServiceManager();
		}
		return ServiceManager.instance;
	}	/**
	 * Get Firestore instance from Firebase Admin
	 */
	private getFirestore() {
		if (!admin) {
			// Try to initialize Firebase Admin first
			if (!initializeFirebaseAdmin()) {
				throw new Error('Firebase Admin SDK not available. Please install firebase-admin dependency.');
			}
		}

		return admin!.firestore();
	}/**
	 * Initialize user services based on their configuration
	 */
	async initializeUserServices(userId: string): Promise<void> {
		try {
			const db = this.getFirestore();

			// Get user profile with service configurations
			const userDoc = await db.collection('users').doc(userId).get();
			if (!userDoc.exists) {
				throw new Error(`User ${userId} not found`);
			}

			const userData = userDoc.data();
			const serviceConfigs = userData?.serviceConfigs || {};

			// Initialize LLM services
			if (serviceConfigs.llm) {
				for (const config of serviceConfigs.llm) {
					await this.initializeLLMService(userId, config);
				}
			}

			// Initialize embedding services
			if (serviceConfigs.embedding) {
				for (const config of serviceConfigs.embedding) {
					await this.initializeEmbeddingService(userId, config);
				}
			}

			console.log(`Initialized services for user ${userId}`);
		} catch (error) {
			console.error(`Failed to initialize services for user ${userId}:`, error);
			throw error;
		}
	}

	/**
	 * Initialize a specific LLM service for a user
	 */
	private async initializeLLMService(userId: string, config: ServiceConfig): Promise<void> {
		try {
			const serviceKey = `${userId}:llm:${config.providerId}`;
			const service = createLLMService(config);
			this.llmServices.set(serviceKey, service);
		} catch (error) {
			console.error(`Failed to initialize LLM service ${config.providerId} for user ${userId}:`, error);
			throw error;
		}
	}

	/**
	 * Initialize a specific embedding service for a user
	 */
	private async initializeEmbeddingService(userId: string, config: ServiceConfig): Promise<void> {
		try {
			const serviceKey = `${userId}:embedding:${config.providerId}`;
			const service = createEmbeddingService(config);
			this.embeddingServices.set(serviceKey, service);
		} catch (error) {
			console.error(`Failed to initialize embedding service ${config.providerId} for user ${userId}:`, error);
			throw error;
		}
	}

	/**
	 * Get LLM service for a user and provider
	 */
	getLLMService(userId: string, providerId: string): LLMService {
		const serviceKey = `${userId}:llm:${providerId}`;
		const service = this.llmServices.get(serviceKey);

		if (!service) {
			throw new Error(`LLM service ${providerId} not found for user ${userId}. Please configure the service first.`);
		}

		return service;
	}

	/**
	 * Get embedding service for a user and provider
	 */
	getEmbeddingService(userId: string, providerId: string): EmbeddingService {
		const serviceKey = `${userId}:embedding:${providerId}`;
		const service = this.embeddingServices.get(serviceKey);

		if (!service) {
			throw new Error(`Embedding service ${providerId} not found for user ${userId}. Please configure the service first.`);
		}

		return service;
	}	/**
	 * Add or update a service configuration for a user
	 */
	async updateServiceConfig(userId: string, serviceType: ServiceType, config: ServiceConfig): Promise<void> {
		try {
			const db = this.getFirestore();

			// Update user document with new service configuration
			const userRef = db.collection('users').doc(userId);
			const userDoc = await userRef.get();

			if (!userDoc.exists) {
				throw new Error(`User ${userId} not found`);
			}

			const userData = userDoc.data();
			const serviceConfigs = userData?.serviceConfigs || {};

			if (!serviceConfigs[serviceType]) {
				serviceConfigs[serviceType] = [];
			}

			// Find existing config for the same provider or add new one
			const existingIndex = serviceConfigs[serviceType].findIndex((c: ServiceConfig) => c.providerId === config.providerId);

			if (existingIndex >= 0) {
				serviceConfigs[serviceType][existingIndex] = config;
			} else {
				serviceConfigs[serviceType].push(config);
			}

			// Update document
			await userRef.update({
				serviceConfigs,
				updatedAt: new Date()
			});

			// Initialize the new service
			if (serviceType === 'llm') {
				await this.initializeLLMService(userId, config);
			} else if (serviceType === 'embedding') {
				await this.initializeEmbeddingService(userId, config);
			}

			console.log(`Updated ${serviceType} service ${config.providerId} for user ${userId}`);
		} catch (error) {
			console.error(`Failed to update service config for user ${userId}:`, error);
			throw error;
		}
	}	/**
	 * Remove a service configuration for a user
	 */
	async removeServiceConfig(userId: string, serviceType: ServiceType, providerId: string): Promise<void> {
		try {
			const db = this.getFirestore();

			// Update user document
			const userRef = db.collection('users').doc(userId);
			const userDoc = await userRef.get();

			if (!userDoc.exists) {
				throw new Error(`User ${userId} not found`);
			}

			const userData = userDoc.data();
			const serviceConfigs = userData?.serviceConfigs || {};

			if (serviceConfigs[serviceType]) {
				serviceConfigs[serviceType] = serviceConfigs[serviceType].filter((c: ServiceConfig) => c.providerId !== providerId);
			}

			await userRef.update({
				serviceConfigs,
				updatedAt: new Date()
			});

			// Remove from memory
			const serviceKey = `${userId}:${serviceType}:${providerId}`;

			if (serviceType === 'llm') {
				this.llmServices.delete(serviceKey);
			} else if (serviceType === 'embedding') {
				this.embeddingServices.delete(serviceKey);
			}

			console.log(`Removed ${serviceType} service ${providerId} for user ${userId}`);
		} catch (error) {
			console.error(`Failed to remove service config for user ${userId}:`, error);
			throw error;
		}
	}
	/**
	 * Record usage for billing and analytics
	 */
	async recordUsage(userId: string, record: Omit<UsageRecord, 'userId'>): Promise<void> {
		try {
			const db = this.getFirestore();

			const usageRecord: UsageRecord = {
				...record,
				userId
			};

			// Store in Firestore
			await db.collection('usage').add(usageRecord);			// Update user's current usage count
			const userRef = db.collection('users').doc(userId);
			await userRef.update({
				usageCurrent: FieldValue ? FieldValue.increment(1) : 1,
				updatedAt: new Date()
			});

		} catch (error) {
			console.error(`Failed to record usage for user ${userId}:`, error);
			throw error;
		}
	}

	/**
	 * Get available service providers for a service type
	 */
	getAvailableProviders(serviceType: ServiceType): string[] {
		switch (serviceType) {
			case 'llm':
				return ['openai', 'azure-openai', 'anthropic'];
			case 'embedding':
				return ['openai', 'azure-openai'];
			default:
				return [];
		}
	}

	/**
	 * Check if a user has configured services
	 */
	async hasConfiguredServices(userId: string, serviceType: ServiceType): Promise<boolean> {
		try {
			const db = this.getFirestore();

			const userDoc = await db.collection('users').doc(userId).get();
			if (!userDoc.exists) {
				return false;
			}

			const userData = userDoc.data();
			const serviceConfigs = userData?.serviceConfigs || {};

			return serviceConfigs[serviceType] && serviceConfigs[serviceType].length > 0;
		} catch (error) {
			console.error(`Failed to check configured services for user ${userId}:`, error);
			return false;
		}
	}

	/**
	 * Get user's service configurations
	 */
	async getUserServiceConfigs(userId: string): Promise<Record<ServiceType, ServiceConfig[]>> {
		try {
			const db = this.getFirestore();

			const userDoc = await db.collection('users').doc(userId).get();
			if (!userDoc.exists) {
				throw new Error(`User ${userId} not found`);
			}

			const userData = userDoc.data();
			return userData?.serviceConfigs || {};
		} catch (error) {
			console.error(`Failed to get service configs for user ${userId}:`, error);
			throw error;
		}
	}

	/**
	 * Cleanup services for a user (useful for logout or cleanup)
	 */
	cleanupUserServices(userId: string): void {
		// Remove all services for the user from memory
		const keysToRemove = [];

		for (const key of this.llmServices.keys()) {
			if (key.startsWith(`${userId}:`)) {
				keysToRemove.push(key);
			}
		}

		for (const key of this.embeddingServices.keys()) {
			if (key.startsWith(`${userId}:`)) {
				keysToRemove.push(key);
			}
		}

		keysToRemove.forEach(key => {
			this.llmServices.delete(key);
			this.embeddingServices.delete(key);
		});

		console.log(`Cleaned up services for user ${userId}`);
	}

	/**
	 * Health check for all services
	 */
	async healthCheck(): Promise<{ llm: number; embedding: number }> {
		return {
			llm: this.llmServices.size,
			embedding: this.embeddingServices.size
		};
	}
}

// Export singleton instance
export const serviceManager = ServiceManager.getInstance();

// Export type for external use
export type { LLMService, EmbeddingService };
