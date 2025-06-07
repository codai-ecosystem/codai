/**
 * Usage Tracking and Quota Enforcement Service
 * Monitors and enforces user quotas for AIDE services
 */

import { getAdminApp } from '../firebase-admin';

interface UsageMetrics {
	apiCalls: number;
	computeMinutes: number;
	storageMB: number;
	lastReset: string;
	updatedAt: string;
}

interface PlanLimits {
	id: string;
	name: string;
	apiCallsPerMonth: number;
	computeMinutesPerMonth: number;
	storageMBLimit: number;
	concurrentAgents: number;
	features: string[];
	price: {
		monthly: number;
		yearly: number;
	};
}

interface UsageEvent {
	userId: string;
	type: 'api_call' | 'compute_minute' | 'storage_mb';
	amount: number;
	metadata?: Record<string, any>;
	timestamp: string;
}

export class UsageTrackingService {
	private db: any; // Using any to avoid Firebase Admin type issues
	private readonly USAGE_COLLECTION = 'users';
	private readonly PLANS_COLLECTION = 'plans';

	constructor() {
		// Get Firebase Admin app and Firestore instance
		const { adminDb } = getAdminApp();
		this.db = adminDb;
	}

	/**
	 * Record usage for a user
	 */
	async recordUsage(event: UsageEvent): Promise<void> {
		try {
			const userRef = this.db.collection(this.USAGE_COLLECTION).doc(event.userId);
			const usageRef = userRef.collection('usage').doc('current');

			// Check current usage and limits before recording
			const canProceed = await this.checkQuotaLimits(event.userId, event.type, event.amount);

			if (!canProceed) {
				throw new Error(`Quota exceeded for ${event.type}`);
			}

			// Record the usage atomically
			await this.db.runTransaction(async (transaction) => {
				const usageDoc = await transaction.get(usageRef);

				if (!usageDoc.exists) {
					// Create initial usage document
					transaction.set(usageRef, {
						apiCalls: event.type === 'api_call' ? event.amount : 0,
						computeMinutes: event.type === 'compute_minute' ? event.amount : 0,
						storageMB: event.type === 'storage_mb' ? event.amount : 0,
						lastReset: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
				} else {
					// Update existing usage
					const updateField = this.getUsageField(event.type);
					const { adminApp } = getAdminApp();
					const FieldValue = adminApp.firestore.FieldValue;
					transaction.update(usageRef, {
						[updateField]: FieldValue.increment(event.amount),
						updatedAt: new Date().toISOString(),
					});
				}

				// Record detailed usage event
				const eventRef = userRef.collection('usage_events').doc();
				transaction.set(eventRef, {
					...event,
					id: eventRef.id,
					recordedAt: new Date().toISOString(),
				});
			});

			console.log(`Usage recorded for user ${event.userId}: ${event.type} +${event.amount}`);
		} catch (error) {
			console.error('Failed to record usage:', error);
			throw error;
		}
	}

	/**
	 * Check if user can perform an action within quota limits
	 */
	async checkQuotaLimits(
		userId: string,
		usageType: 'api_call' | 'compute_minute' | 'storage_mb',
		requestedAmount: number = 1
	): Promise<boolean> {
		try {
			// Get user's current plan
			const userPlan = await this.getUserPlan(userId);
			if (!userPlan) {
				throw new Error('User plan not found');
			}

			// Get current usage
			const currentUsage = await this.getCurrentUsage(userId);

			// Check limits based on usage type
			switch (usageType) {
				case 'api_call':
					return (currentUsage.apiCalls + requestedAmount) <= userPlan.apiCallsPerMonth;
				case 'compute_minute':
					return (currentUsage.computeMinutes + requestedAmount) <= userPlan.computeMinutesPerMonth;
				case 'storage_mb':
					return (currentUsage.storageMB + requestedAmount) <= userPlan.storageMBLimit;
				default:
					return false;
			}
		} catch (error) {
			console.error('Error checking quota limits:', error);
			return false; // Fail-safe: deny if we can't check
		}
	}

	/**
	 * Get user's current usage metrics
	 */
	async getCurrentUsage(userId: string): Promise<UsageMetrics> {
		try {
			const usageRef = this.db
				.collection(this.USAGE_COLLECTION)
				.doc(userId)
				.collection('usage')
				.doc('current');

			const usageDoc = await usageRef.get();

			if (!usageDoc.exists) {
				// Return default usage if none exists
				return {
					apiCalls: 0,
					computeMinutes: 0,
					storageMB: 0,
					lastReset: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};
			}

			return usageDoc.data() as UsageMetrics;
		} catch (error) {
			console.error('Failed to get current usage:', error);
			throw error;
		}
	}

	/**
	 * Get user's plan limits
	 */
	async getUserPlan(userId: string): Promise<PlanLimits | null> {
		try {
			// Get user document to find their plan ID
			const userDoc = await this.db.collection(this.USAGE_COLLECTION).doc(userId).get();

			if (!userDoc.exists) {
				return null;
			}

			const userData = userDoc.data();
			const planId = userData?.plan || 'free';

			// Get plan details
			const planDoc = await this.db.collection(this.PLANS_COLLECTION).doc(planId).get();

			if (!planDoc.exists) {
				// Return default free plan if plan not found
				return this.getDefaultFreePlan();
			}

			return planDoc.data() as PlanLimits;
		} catch (error) {
			console.error('Failed to get user plan:', error);
			return this.getDefaultFreePlan();
		}
	}

	/**
	 * Check if user is approaching quota limits (warning threshold)
	 */
	async checkQuotaWarnings(userId: string): Promise<{
		apiCalls: { warning: boolean; percentage: number };
		computeMinutes: { warning: boolean; percentage: number };
		storageMB: { warning: boolean; percentage: number };
	}> {
		try {
			const [currentUsage, userPlan] = await Promise.all([
				this.getCurrentUsage(userId),
				this.getUserPlan(userId)
			]);

			if (!userPlan) {
				throw new Error('User plan not found');
			}

			const warningThreshold = 0.8; // 80% threshold for warnings

			return {
				apiCalls: {
					warning: (currentUsage.apiCalls / userPlan.apiCallsPerMonth) >= warningThreshold,
					percentage: Math.round((currentUsage.apiCalls / userPlan.apiCallsPerMonth) * 100)
				},
				computeMinutes: {
					warning: (currentUsage.computeMinutes / userPlan.computeMinutesPerMonth) >= warningThreshold,
					percentage: Math.round((currentUsage.computeMinutes / userPlan.computeMinutesPerMonth) * 100)
				},
				storageMB: {
					warning: (currentUsage.storageMB / userPlan.storageMBLimit) >= warningThreshold,
					percentage: Math.round((currentUsage.storageMB / userPlan.storageMBLimit) * 100)
				}
			};
		} catch (error) {
			console.error('Failed to check quota warnings:', error);
			throw error;
		}
	}

	/**
	 * Reset monthly quotas for a user
	 */
	async resetUserQuota(userId: string): Promise<void> {
		try {
			const usageRef = this.db
				.collection(this.USAGE_COLLECTION)
				.doc(userId)
				.collection('usage')
				.doc('current');

			await usageRef.set({
				apiCalls: 0,
				computeMinutes: 0,
				storageMB: 0,
				lastReset: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			}, { merge: true });

			console.log(`Quota reset completed for user: ${userId}`);
		} catch (error) {
			console.error('Failed to reset user quota:', error);
			throw error;
		}
	}

	/**
	 * Get usage analytics for admin dashboard
	 */
	async getUsageAnalytics(timeRange: 'day' | 'week' | 'month' = 'month'): Promise<{
		totalUsers: number;
		totalApiCalls: number;
		totalComputeMinutes: number;
		totalStorageMB: number;
		planDistribution: Record<string, number>;
	}> {
		try {
			const users = await this.db.collection(this.USAGE_COLLECTION).get();
			let totalApiCalls = 0;
			let totalComputeMinutes = 0;
			let totalStorageMB = 0;
			const planDistribution: Record<string, number> = {};

			for (const userDoc of users.docs) {
				const userData = userDoc.data();
				const plan = userData.plan || 'free';

				planDistribution[plan] = (planDistribution[plan] || 0) + 1;

				// Get user's current usage
				const usageDoc = await userDoc.ref.collection('usage').doc('current').get();
				if (usageDoc.exists) {
					const usage = usageDoc.data() as UsageMetrics;
					totalApiCalls += usage.apiCalls;
					totalComputeMinutes += usage.computeMinutes;
					totalStorageMB += usage.storageMB;
				}
			}

			return {
				totalUsers: users.size,
				totalApiCalls,
				totalComputeMinutes,
				totalStorageMB,
				planDistribution,
			};
		} catch (error) {
			console.error('Failed to get usage analytics:', error);
			throw error;
		}
	}

	/**
	 * Update user's plan
	 */
	async updateUserPlan(userId: string, planId: string): Promise<void> {
		try {
			await this.db.collection(this.USAGE_COLLECTION).doc(userId).update({
				plan: planId,
				updatedAt: new Date().toISOString(),
			});

			console.log(`Plan updated for user ${userId}: ${planId}`);
		} catch (error) {
			console.error('Failed to update user plan:', error);
			throw error;
		}
	}

	/**
	 * Initialize default plans in Firestore
	 */
	async initializeDefaultPlans(): Promise<void> {
		const defaultPlans: PlanLimits[] = [
			{
				id: 'free',
				name: 'Free',
				apiCallsPerMonth: 1000,
				computeMinutesPerMonth: 60,
				storageMBLimit: 100,
				concurrentAgents: 1,
				features: ['Basic AI assistance', 'Single project'],
				price: { monthly: 0, yearly: 0 }
			},
			{
				id: 'professional',
				name: 'Professional',
				apiCallsPerMonth: 10000,
				computeMinutesPerMonth: 500,
				storageMBLimit: 1000,
				concurrentAgents: 3,
				features: ['Advanced AI assistance', 'Multiple projects', 'Priority support'],
				price: { monthly: 29, yearly: 290 }
			},
			{
				id: 'enterprise',
				name: 'Enterprise',
				apiCallsPerMonth: 100000,
				computeMinutesPerMonth: 5000,
				storageMBLimit: 10000,
				concurrentAgents: 10,
				features: ['Unlimited AI assistance', 'Unlimited projects', 'Dedicated support', 'Custom integrations'],
				price: { monthly: 99, yearly: 990 }
			}
		];

		for (const plan of defaultPlans) {
			await this.db.collection(this.PLANS_COLLECTION).doc(plan.id).set(plan);
		}

		console.log('Default plans initialized');
	}

	/**
	 * Check if user can perform an action based on quotas
	 */
	async canUserPerformAction(
		userId: string,
		usageType: 'api-calls' | 'compute-minutes' | 'storage',
		amount: number = 1
	): Promise<boolean> {
		try {
			const [currentUsage, userPlan] = await Promise.all([
				this.getCurrentUsage(userId),
				this.getUserPlan(userId)
			]);

			if (!userPlan) {
				return false;
			}

			// Check against plan limits
			switch (usageType) {
				case 'api-calls':
					return currentUsage.apiCalls + amount <= userPlan.apiCallsPerMonth;
				case 'compute-minutes':
					return currentUsage.computeMinutes + amount <= userPlan.computeMinutesPerMonth;
				case 'storage':
					return currentUsage.storageMB + amount <= userPlan.storageMBLimit;
				default:
					return false;
			}
		} catch (error) {
			console.error('Failed to check user action permission:', error);
			return false;
		}
	}

	/**
	 * Check quota status for a user
	 */
	async checkQuotaStatus(userId: string): Promise<{
		usage: UsageMetrics;
		plan: PlanLimits | null;
		remainingQuota: {
			apiCalls: number;
			computeMinutes: number;
			storage: number;
		};
		warningThresholds: {
			apiCalls: boolean;
			computeMinutes: boolean;
			storage: boolean;
		};
	}> {
		try {
			const [currentUsage, userPlan] = await Promise.all([
				this.getCurrentUsage(userId),
				this.getUserPlan(userId)
			]);

			if (!userPlan) {
				throw new Error('User plan not found');
			}

			const remainingQuota = {
				apiCalls: Math.max(0, userPlan.apiCallsPerMonth - currentUsage.apiCalls),
				computeMinutes: Math.max(0, userPlan.computeMinutesPerMonth - currentUsage.computeMinutes),
				storage: Math.max(0, userPlan.storageMBLimit - currentUsage.storageMB)
			};

			// Warning thresholds at 80% usage
			const warningThresholds = {
				apiCalls: (currentUsage.apiCalls / userPlan.apiCallsPerMonth) >= 0.8,
				computeMinutes: (currentUsage.computeMinutes / userPlan.computeMinutesPerMonth) >= 0.8,
				storage: (currentUsage.storageMB / userPlan.storageMBLimit) >= 0.8
			};

			return {
				usage: currentUsage,
				plan: userPlan,
				remainingQuota,
				warningThresholds
			};
		} catch (error) {
			console.error('Failed to check quota status:', error);
			throw error;
		}
	}

	/**
	 * Track usage for a user with metadata
	 */
	async trackUsage(
		userId: string,
		usageType: 'api_call' | 'compute_minute' | 'storage_mb',
		amount: number,
		metadata?: {
			endpoint?: string;
			operation?: string;
			details?: Record<string, any>;
		}
	): Promise<void> {
		try {
			await this.recordUsage({
				userId,
				type: usageType,
				amount,
				timestamp: new Date().toISOString(),
				metadata: metadata?.details || {}
			});
		} catch (error) {
			console.error('Failed to track usage:', error);
			throw error;
		}
	}

	/**
	 * Get system-wide usage statistics (admin only)
	 */
	async getSystemStats(): Promise<{
		totalUsers: number;
		activeUsers: number;
		totalUsage: {
			apiCalls: number;
			computeMinutes: number;
			storage: number;
		};
		plansDistribution: Array<{
			planId: string;
			count: number;
		}>;
	}> {
		try {
			// Get all user usage documents
			const usageSnapshot = await this.db.collection(this.USAGE_COLLECTION).get();

			let totalUsers = 0;
			let activeUsers = 0;
			const totalUsage = {
				apiCalls: 0,
				computeMinutes: 0,
				storage: 0
			};
			const planCounts: Record<string, number> = {};

			for (const doc of usageSnapshot.docs) {
				const data = doc.data();
				totalUsers++;

				// Consider user active if they have usage in the last 30 days
				const lastUsed = new Date(data.lastUsed || 0);
				const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

				if (lastUsed > thirtyDaysAgo) {
					activeUsers++;
				}

				// Aggregate usage
				const userUsage = await this.getCurrentUsage(doc.id);
				totalUsage.apiCalls += userUsage.apiCalls;
				totalUsage.computeMinutes += userUsage.computeMinutes;
				totalUsage.storage += userUsage.storageMB;

				// Count plans
				const plan = data.plan || 'free';
				planCounts[plan] = (planCounts[plan] || 0) + 1;
			}

			const plansDistribution = Object.entries(planCounts).map(([planId, count]) => ({
				planId,
				count
			}));

			return {
				totalUsers,
				activeUsers,
				totalUsage,
				plansDistribution
			};
		} catch (error) {
			console.error('Failed to get system stats:', error);
			throw error;
		}
	}

	/**
	 * Get usage history for a user (with filtering)
	 */
	async getUsageHistory(
		userId: string,
		options?: {
			startDate?: string;
			endDate?: string;
			limit?: number;
			usageType?: string;
		}
	): Promise<Array<{
		timestamp: string;
		type: string;
		amount: number;
		metadata?: Record<string, any>;
	}>> {
		try {
			let query = this.db
				.collection(this.USAGE_COLLECTION)
				.doc(userId)
				.collection('history')
				.orderBy('timestamp', 'desc');

			if (options?.startDate) {
				query = query.where('timestamp', '>=', options.startDate);
			}

			if (options?.endDate) {
				query = query.where('timestamp', '<=', options.endDate);
			}

			if (options?.usageType) {
				query = query.where('type', '==', options.usageType);
			}

			if (options?.limit) {
				query = query.limit(options.limit);
			}

			const snapshot = await query.get();

			return snapshot.docs.map(doc => ({
				timestamp: doc.data().timestamp,
				type: doc.data().type,
				amount: doc.data().amount,
				metadata: doc.data().metadata
			}));
		} catch (error) {
			console.error('Failed to get usage history:', error);
			throw error;
		}
	}

	/**
	 * Reset user quotas (admin only)
	 */
	async resetUserQuotas(userId: string): Promise<void> {
		return this.resetUserQuota(userId);
	}

	/**
	 * Helper methods
	 */
	private getUsageField(type: string): string {
		switch (type) {
			case 'api_call': return 'apiCalls';
			case 'compute_minute': return 'computeMinutes';
			case 'storage_mb': return 'storageMB';
			default: throw new Error(`Unknown usage type: ${type}`);
		}
	}

	private getDefaultFreePlan(): PlanLimits {
		return {
			id: 'free',
			name: 'Free',
			apiCallsPerMonth: 1000,
			computeMinutesPerMonth: 60,
			storageMBLimit: 100,
			concurrentAgents: 1,
			features: ['Basic AI assistance', 'Single project'],
			price: { monthly: 0, yearly: 0 }
		};
	}
}

/**
 * Factory function to create usage tracking service instance
 */
export function createUsageTrackingService(): UsageTrackingService {
	return new UsageTrackingService();
}
