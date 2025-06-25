/**
 * Quota enforcement middleware for AIDE services
 * Checks user quotas and enforces limits based on their plan
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '../firebase-admin';

export interface QuotaCheck {
	userId: string;
	serviceType: 'api' | 'compute' | 'storage' | 'deployment';
	amount: number;
	operation?: string;
}

export interface QuotaLimits {
	apiCalls: number;
	computeMinutes: number;
	storageMB: number;
	deployments: number;
	concurrentSessions: number;
}

export interface UsageStats {
	apiCalls: number;
	computeMinutes: number;
	storageMB: number;
	deployments: number;
	lastReset: string;
	updatedAt: string;
}

/**
 * Check if user has quota available for the requested operation
 */
export async function checkQuota(
	check: QuotaCheck
): Promise<{ allowed: boolean; usage?: UsageStats; limits?: QuotaLimits; message?: string }> {
	try {
		const admin = getAdminApp();
		const db = (admin as any).firestore();

		// Get user's current plan and limits
		const userDoc = await db.collection('users').doc(check.userId).get();

		if (!userDoc.exists) {
			return {
				allowed: false,
				message: 'User not found',
			};
		}

		const userData = userDoc.data();
		const planId = userData.planId || 'free';

		// Get plan limits
		const planDoc = await db.collection('plans').doc(planId).get();

		if (!planDoc.exists) {
			// Default to free tier limits if plan not found
			const defaultLimits: QuotaLimits = {
				apiCalls: 1000,
				computeMinutes: 60,
				storageMB: 100,
				deployments: 3,
				concurrentSessions: 1,
			};

			return await checkUsageAgainstLimits(db, check, defaultLimits);
		}

		const planData = planDoc.data();
		const limits: QuotaLimits = {
			apiCalls: planData.limits?.apiCalls || 1000,
			computeMinutes: planData.limits?.computeMinutes || 60,
			storageMB: planData.limits?.storageMB || 100,
			deployments: planData.limits?.deployments || 3,
			concurrentSessions: planData.limits?.concurrentSessions || 1,
		};

		return await checkUsageAgainstLimits(db, check, limits);
	} catch (error) {
		console.error('Error checking quota:', error);
		return {
			allowed: false,
			message: 'Error checking quota',
		};
	}
}

/**
 * Check current usage against limits
 */
async function checkUsageAgainstLimits(
	db: any,
	check: QuotaCheck,
	limits: QuotaLimits
): Promise<{ allowed: boolean; usage: UsageStats; limits: QuotaLimits; message?: string }> {
	// Get current usage
	const usageDoc = await db
		.collection('users')
		.doc(check.userId)
		.collection('usage')
		.doc('current')
		.get();

	const currentUsage: UsageStats = usageDoc.exists
		? (usageDoc.data() as UsageStats)
		: {
				apiCalls: 0,
				computeMinutes: 0,
				storageMB: 0,
				deployments: 0,
				lastReset: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

	// Check against limits based on service type
	let currentValue = 0;
	let limitValue = 0;

	switch (check.serviceType) {
		case 'api':
			currentValue = currentUsage.apiCalls;
			limitValue = limits.apiCalls;
			break;
		case 'compute':
			currentValue = currentUsage.computeMinutes;
			limitValue = limits.computeMinutes;
			break;
		case 'storage':
			currentValue = currentUsage.storageMB;
			limitValue = limits.storageMB;
			break;
		case 'deployment':
			currentValue = currentUsage.deployments;
			limitValue = limits.deployments;
			break;
	}

	const wouldExceed = currentValue + check.amount > limitValue;

	return {
		allowed: !wouldExceed,
		usage: currentUsage,
		limits,
		message: wouldExceed
			? `Quota exceeded. Current: ${currentValue}, Requested: ${check.amount}, Limit: ${limitValue}`
			: undefined,
	};
}

/**
 * Update usage after successful operation
 */
export async function updateUsage(
	userId: string,
	serviceType: QuotaCheck['serviceType'],
	amount: number
): Promise<void> {
	try {
		const admin = getAdminApp();
		const db = (admin as any).firestore();

		const usageRef = db.collection('users').doc(userId).collection('usage').doc('current');

		const usageDoc = await usageRef.get();
		const currentUsage = usageDoc.exists
			? usageDoc.data()
			: {
					apiCalls: 0,
					computeMinutes: 0,
					storageMB: 0,
					deployments: 0,
					lastReset: new Date().toISOString(),
				};

		// Update the appropriate field
		const updateData: any = {
			updatedAt: new Date().toISOString(),
		};

		switch (serviceType) {
			case 'api':
				updateData.apiCalls = (currentUsage.apiCalls || 0) + amount;
				break;
			case 'compute':
				updateData.computeMinutes = (currentUsage.computeMinutes || 0) + amount;
				break;
			case 'storage':
				updateData.storageMB = Math.max(0, (currentUsage.storageMB || 0) + amount);
				break;
			case 'deployment':
				updateData.deployments = (currentUsage.deployments || 0) + amount;
				break;
		}

		await usageRef.set(updateData, { merge: true });

		// Also log to usage history
		await db.collection('users').doc(userId).collection('usage_history').add({
			serviceType,
			amount,
			timestamp: new Date().toISOString(),
			operation: 'increment',
		});
	} catch (error) {
		console.error('Error updating usage:', error);
		throw error;
	}
}

/**
 * Middleware function to wrap API routes with quota checking
 */
export function withQuotaCheck(serviceType: QuotaCheck['serviceType'], amount: number = 1) {
	return function (handler: (req: NextRequest, context: any) => Promise<NextResponse>) {
		return async (req: NextRequest, context: any) => {
			// Extract user ID from context (should be set by auth middleware)
			const userId = context?.uid;

			if (!userId) {
				return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
			}

			// Check quota
			const quotaCheck = await checkQuota({
				userId,
				serviceType,
				amount,
			});

			if (!quotaCheck.allowed) {
				return NextResponse.json(
					{
						error: 'Quota exceeded',
						message: quotaCheck.message,
						usage: quotaCheck.usage,
						limits: quotaCheck.limits,
					},
					{ status: 429 }
				);
			}

			// Execute the handler
			const response = await handler(req, context);

			// If successful, update usage
			if (response.status >= 200 && response.status < 300) {
				try {
					await updateUsage(userId, serviceType, amount);
				} catch (error) {
					console.error('Error updating usage after successful operation:', error);
					// Don't fail the request if usage update fails
				}
			}

			return response;
		};
	};
}

/**
 * Get current usage and limits for a user
 */
export async function getUserQuotaStatus(userId: string): Promise<{
	usage: UsageStats;
	limits: QuotaLimits;
	planId: string;
}> {
	const admin = getAdminApp();
	const db = (admin as any).firestore();

	// Get user plan
	const userDoc = await db.collection('users').doc(userId).get();
	const userData = userDoc.exists ? userDoc.data() : {};
	const planId = userData.planId || 'free';

	// Get plan limits
	const planDoc = await db.collection('plans').doc(planId).get();
	const planData = planDoc.exists ? planDoc.data() : {};

	const limits: QuotaLimits = {
		apiCalls: planData.limits?.apiCalls || 1000,
		computeMinutes: planData.limits?.computeMinutes || 60,
		storageMB: planData.limits?.storageMB || 100,
		deployments: planData.limits?.deployments || 3,
		concurrentSessions: planData.limits?.concurrentSessions || 1,
	};

	// Get current usage
	const usageDoc = await db
		.collection('users')
		.doc(userId)
		.collection('usage')
		.doc('current')
		.get();

	const usage: UsageStats = usageDoc.exists
		? (usageDoc.data() as UsageStats)
		: {
				apiCalls: 0,
				computeMinutes: 0,
				storageMB: 0,
				deployments: 0,
				lastReset: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

	return {
		usage,
		limits,
		planId,
	};
}
