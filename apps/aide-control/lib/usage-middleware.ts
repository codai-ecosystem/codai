/**
 * Usage tracking middleware for AIDE Control Panel
 * Tracks API calls, token usage, and enforces quotas
 */
import { NextRequest, NextResponse } from 'next/server';
import { FirestoreService, type UserDocument, type UsageDocument } from './firebase-admin';

/**
 * Usage tracking configuration
 */
interface UsageConfig {
	service: string;
	type: 'api_call' | 'token_usage' | 'deployment' | 'storage';
	cost?: number;
	metadata?: Record<string, any>;
}

/**
 * Track usage for a specific operation
 */
export async function trackUsage(
	userId: string,
	projectId: string | null,
	config: UsageConfig,
	amount: number = 1,
	unit: string = 'requests'
): Promise<void> {
	try {
		await FirestoreService.logUsage({
			userId,
			projectId,
			type: config.type,
			service: config.service,
			amount,
			unit,
			cost: config.cost,
			metadata: config.metadata || {}
		});
	} catch (error) {
		console.error('Failed to track usage:', error);
		// Don't fail the main operation if usage tracking fails
	}
}

/**
 * Check if user has exceeded their quota for a specific usage type
 */
export async function checkQuota(
	user: UserDocument,
	type: 'api_call' | 'token_usage' | 'deployment' | 'storage',
	amount: number = 1
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
	try {
		// Get current usage for this month
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

		// TODO: Implement efficient usage aggregation query
		// For now, return basic limits based on user plan
		let limit: number;
		switch (type) {
			case 'token_usage':
				limit = user.limits.tokensPerMonth;
				break;
			case 'deployment':
				limit = user.limits.deploymentsPerMonth;
				break;
			case 'api_call':
				limit = 10000; // Default API call limit
				break;
			case 'storage':
				limit = 5 * 1024 * 1024 * 1024; // 5GB default
				break;
			default:
				limit = 1000;
		}

		// For now, return simplified quota check
		// In production, this would query usage collection and aggregate
		const remaining = Math.max(0, limit - amount);
		const allowed = remaining >= 0;

		return { allowed, remaining, limit };
	} catch (error) {
		console.error('Failed to check quota:', error);
		// Allow operation if quota check fails (fail open)
		return { allowed: true, remaining: 0, limit: 0 };
	}
}

/**
 * Middleware to track usage and enforce quotas
 */
export function withUsageTracking(
	config: UsageConfig,
	options: {
		checkQuota?: boolean;
		amount?: number;
		unit?: string;
		getProjectId?: (req: NextRequest) => string | null;
	} = {}
) {
	return function <T extends (req: NextRequest, user: UserDocument) => Promise<NextResponse>>(
		handler: T
	): T {
		return (async (req: NextRequest, user: UserDocument) => {
			const amount = options.amount || 1;
			const unit = options.unit || 'requests';
			const projectId = options.getProjectId ? options.getProjectId(req) : null;

			// Check quota if required
			if (options.checkQuota) {
				const quotaCheck = await checkQuota(user, config.type, amount);
				if (!quotaCheck.allowed) {
					return NextResponse.json(
						{
							error: 'Quota exceeded',
							details: {
								type: config.type,
								limit: quotaCheck.limit,
								remaining: quotaCheck.remaining
							}
						},
						{ status: 429 }
					);
				}
			}

			// Execute the handler
			const response = await handler(req, user);

			// Track usage after successful operation (only for 2xx responses)
			if (response.status >= 200 && response.status < 300) {
				// Fire and forget usage tracking
				trackUsage(user.uid, projectId, config, amount, unit)
					.catch(error => console.error('Usage tracking failed:', error));
			}

			return response;
		}) as T;
	};
}

/**
 * Middleware for API endpoints that consume tokens
 */
export function withTokenTracking(tokensUsed: number, service: string = 'aide-api') {
	return withUsageTracking(
		{
			service,
			type: 'token_usage',
		},
		{
			checkQuota: true,
			amount: tokensUsed,
			unit: 'tokens'
		}
	);
}

/**
 * Middleware for deployment operations
 */
export function withDeploymentTracking(projectId?: string) {
	return withUsageTracking(
		{
			service: 'aide-deployment',
			type: 'deployment',
		},
		{
			checkQuota: true,
			amount: 1,
			unit: 'deployments',
			getProjectId: () => projectId || null
		}
	);
}

/**
 * Middleware for general API call tracking
 */
export function withApiCallTracking(service: string = 'aide-api') {
	return withUsageTracking(
		{
			service,
			type: 'api_call',
		},
		{
			checkQuota: false, // Don't enforce quota on general API calls
			amount: 1,
			unit: 'requests'
		}
	);
}

/**
 * Get usage statistics for a user
 */
export async function getUserUsageStats(
	userId: string,
	startDate?: Date,
	endDate?: Date
): Promise<{
	tokenUsage: number;
	apiCalls: number;
	deployments: number;
	storageUsed: number;
	costs: number;
}> {
	try {
		// TODO: Implement efficient aggregation query
		// For now, return placeholder data
		return {
			tokenUsage: 0,
			apiCalls: 0,
			deployments: 0,
			storageUsed: 0,
			costs: 0
		};
	} catch (error) {
		console.error('Failed to get usage stats:', error);
		return {
			tokenUsage: 0,
			apiCalls: 0,
			deployments: 0,
			storageUsed: 0,
			costs: 0
		};
	}
}

/**
 * Get usage statistics for a project
 */
export async function getProjectUsageStats(
	projectId: string,
	startDate?: Date,
	endDate?: Date
): Promise<{
	deployments: number;
	storageUsed: number;
	bandwidthUsed: number;
	buildMinutesUsed: number;
	costs: number;
}> {
	try {
		// TODO: Implement efficient aggregation query
		// For now, return placeholder data
		return {
			deployments: 0,
			storageUsed: 0,
			bandwidthUsed: 0,
			buildMinutesUsed: 0,
			costs: 0
		};
	} catch (error) {
		console.error('Failed to get project usage stats:', error);
		return {
			deployments: 0,
			storageUsed: 0,
			bandwidthUsed: 0,
			buildMinutesUsed: 0,
			costs: 0
		};
	}
}
