/**
 * Middleware for tracking and enforcing usage quotas
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from './firebase-admin';

export interface UsageTracker {
	userId: string;
	action: 'api_call' | 'compute_minute' | 'storage_mb';
	amount?: number;
	metadata?: Record<string, any>;
}

export interface UserQuotas {
	apiCalls: number;
	computeMinutes: number;
	storageMB: number;
}

export interface UsageStats {
	apiCalls: number;
	computeMinutes: number;
	storageMB: number;
	lastReset: string;
}

/**
 * Track usage for a user
 */
export async function trackUsage(tracker: UsageTracker): Promise<void> {
	try {
		const admin = getAdminApp();
		const db = (admin as any).firestore();

		const usageRef = db
			.collection('users')
			.doc(tracker.userId)
			.collection('usage')
			.doc('current');

		const amount = tracker.amount || 1;

		// Increment the appropriate counter
		const increment = (admin as any).firestore.FieldValue.increment(amount);
		const updateData: any = {
			updatedAt: new Date().toISOString(),
		};

		switch (tracker.action) {
			case 'api_call':
				updateData.apiCalls = increment;
				break;
			case 'compute_minute':
				updateData.computeMinutes = increment;
				break;
			case 'storage_mb':
				updateData.storageMB = increment;
				break;
		}

		await usageRef.update(updateData);

		// Log the usage event
		await db.collection('usage_logs').add({
			userId: tracker.userId,
			action: tracker.action,
			amount,
			metadata: tracker.metadata || {},
			timestamp: new Date().toISOString(),
		});

	} catch (error) {
		console.error('Error tracking usage:', error);
		throw error;
	}
}

/**
 * Get current usage for a user
 */
export async function getCurrentUsage(userId: string): Promise<UsageStats> {
	try {
		const admin = getAdminApp();
		const db = (admin as any).firestore();

		const usageDoc = await db
			.collection('users')
			.doc(userId)
			.collection('usage')
			.doc('current')
			.get();

		if (!usageDoc.exists) {
			// Initialize usage document
			const initialUsage = {
				apiCalls: 0,
				computeMinutes: 0,
				storageMB: 0,
				lastReset: new Date().toISOString(),
				createdAt: new Date().toISOString(),
			};

			await usageDoc.ref.set(initialUsage);
			return initialUsage;
		}

		return usageDoc.data() as UsageStats;
	} catch (error) {
		console.error('Error getting current usage:', error);
		throw error;
	}
}

/**
 * Get user quotas from their plan
 */
export async function getUserQuotas(userId: string): Promise<UserQuotas> {
	try {
		const admin = getAdminApp();
		const db = (admin as any).firestore();

		// Get user data to find their plan
		const userDoc = await db.collection('users').doc(userId).get();
		if (!userDoc.exists) {
			throw new Error('User not found');
		}

		const userData = userDoc.data();
		const planId = userData.planId || 'free';

		// Get plan quotas
		const planDoc = await db.collection('plans').doc(planId).get();
		if (!planDoc.exists) {
			throw new Error('Plan not found');
		}

		const planData = planDoc.data();
		return {
			apiCalls: planData.quotas?.apiCalls || 0,
			computeMinutes: planData.quotas?.computeMinutes || 0,
			storageMB: planData.quotas?.storageMB || 0,
		};
	} catch (error) {
		console.error('Error getting user quotas:', error);
		throw error;
	}
}

/**
 * Check if user has exceeded their quotas
 */
export async function checkQuotaExceeded(
	userId: string,
	action: UsageTracker['action'],
	amount: number = 1
): Promise<{ exceeded: boolean; remaining: number }> {
	try {
		const [usage, quotas] = await Promise.all([
			getCurrentUsage(userId),
			getUserQuotas(userId),
		]);

		let currentUsage: number;
		let quota: number;

		switch (action) {
			case 'api_call':
				currentUsage = usage.apiCalls;
				quota = quotas.apiCalls;
				break;
			case 'compute_minute':
				currentUsage = usage.computeMinutes;
				quota = quotas.computeMinutes;
				break;
			case 'storage_mb':
				currentUsage = usage.storageMB;
				quota = quotas.storageMB;
				break;
		}

		const remaining = Math.max(0, quota - currentUsage);
		const exceeded = currentUsage + amount > quota;

		return { exceeded, remaining };
	} catch (error) {
		console.error('Error checking quota:', error);
		return { exceeded: false, remaining: Infinity };
	}
}

/**
 * Middleware to enforce quotas before processing requests
 */
export function withQuotaCheck(
	action: UsageTracker['action'],
	amount: number = 1
) {
	return function (handler: (req: NextRequest, context: any) => Promise<NextResponse>) {
		return async function (req: NextRequest, context: any) {
			try {
				// Extract user ID from context (assumed to be set by auth middleware)
				const userId = context.uid || context.userId;

				if (!userId) {
					return NextResponse.json(
						{ error: 'Authentication required' },
						{ status: 401 }
					);
				}

				// Check quota before proceeding
				const quotaCheck = await checkQuotaExceeded(userId, action, amount);

				if (quotaCheck.exceeded) {
					return NextResponse.json(
						{
							error: 'Quota exceeded',
							action,
							remaining: quotaCheck.remaining,
						},
						{ status: 429 }
					);
				}

				// Process the request
				const response = await handler(req, context);

				// Track usage after successful request
				if (response.status >= 200 && response.status < 300) {
					await trackUsage({
						userId,
						action,
						amount,
						metadata: {
							endpoint: req.url,
							method: req.method,
						},
					});
				}

				return response;
			} catch (error) {
				console.error('Quota check middleware error:', error);
				return NextResponse.json(
					{ error: 'Internal server error' },
					{ status: 500 }
				);
			}
		};
	};
}

/**
 * Reset monthly quotas for all users
 */
export async function resetMonthlyQuotas(): Promise<void> {
	try {
		const admin = getAdminApp();
		const db = (admin as any).firestore();

		// Get all users
		const usersSnapshot = await db.collection('users').get();
		const batch = db.batch();

		for (const userDoc of usersSnapshot.docs) {
			const usageRef = userDoc.ref.collection('usage').doc('current');

			batch.set(usageRef, {
				apiCalls: 0,
				computeMinutes: 0,
				storageMB: 0,
				lastReset: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
		}

		await batch.commit();
		console.log(`Reset quotas for ${usersSnapshot.size} users`);
	} catch (error) {
		console.error('Error resetting monthly quotas:', error);
		throw error;
	}
}
