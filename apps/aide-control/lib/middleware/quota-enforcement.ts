/**
 * Enhanced Quota Enforcement Middleware
 * Integrates with the new usage tracking service for real-time quota checks
 */
import { NextRequest, NextResponse } from 'next/server';
import { FirestoreService, type UserDocument } from '../firebase-admin';
import { UsageTrackingService } from '../services/usage-tracking';

export interface QuotaCheckOptions {
	/** Type of usage to check ('api-calls', 'compute-minutes', 'storage') */
	usageType: 'api-calls' | 'compute-minutes' | 'storage';
	/** Amount of usage this request will consume */
	amount: number;
	/** Whether to track usage immediately after successful quota check */
	trackUsage?: boolean;
	/** Additional metadata to include with usage tracking */
	metadata?: Record<string, any>;
}

export interface QuotaEnforcementResult {
	allowed: boolean;
	quotaStatus?: any;
	remainingQuota?: number;
	warningThreshold?: boolean;
	error?: string;
}

/**
 * Middleware function that checks quotas before allowing API requests
 */
export function withQuotaEnforcement(
	options: QuotaCheckOptions,
	handler: (req: NextRequest, user: UserDocument) => Promise<NextResponse>
) {
	return async (req: NextRequest, user: UserDocument): Promise<NextResponse> => {
		try {
			const usageService = new UsageTrackingService();

			// Check if user can perform this action
			const canPerform = await usageService.canUserPerformAction(
				user.uid,
				options.usageType,
				options.amount
			);
			if (!canPerform) {
				// Get quota status for detailed error message
				const quotaStatus = await usageService.checkQuotaStatus(user.uid);

				const quotaTypeMap = {
					'api-calls': {
						current: quotaStatus.usage.apiCalls,
						limit: quotaStatus.plan?.apiCallsPerMonth || 0,
						remaining: quotaStatus.remainingQuota.apiCalls,
						warning: quotaStatus.warningThresholds.apiCalls,
					},
					'compute-minutes': {
						current: quotaStatus.usage.computeMinutes,
						limit: quotaStatus.plan?.computeMinutesPerMonth || 0,
						remaining: quotaStatus.remainingQuota.computeMinutes,
						warning: quotaStatus.warningThresholds.computeMinutes,
					},
					storage: {
						current: quotaStatus.usage.storageMB,
						limit: quotaStatus.plan?.storageMBLimit || 0,
						remaining: quotaStatus.remainingQuota.storage,
						warning: quotaStatus.warningThresholds.storage,
					},
				};

				const currentQuota = quotaTypeMap[options.usageType];

				// Log quota exceeded event
				await FirestoreService.logAudit({
					userId: user.uid,
					action: 'QUOTA_EXCEEDED',
					resource: 'quota',
					resourceId: options.usageType,
					details: {
						action: 'User exceeded quota limit',
						usageType: options.usageType,
						requestedAmount: options.amount,
						currentUsage: currentQuota?.current || 0,
						limit: currentQuota?.limit || 0,
						planType: user.plan,
					},
				});

				return NextResponse.json(
					{
						error: 'Quota exceeded',
						message: `You have exceeded your ${options.usageType.replace('-', ' ')} quota`,
						quotaStatus: currentQuota,
						upgradeUrl: '/pricing',
					},
					{ status: 429 } // Too Many Requests
				);
			}
			// Check if user is approaching quota limits
			const quotaStatus = await usageService.checkQuotaStatus(user.uid);
			const quotaTypeMap = {
				'api-calls': {
					current: quotaStatus.usage.apiCalls,
					limit: quotaStatus.plan?.apiCallsPerMonth || 0,
					remaining: quotaStatus.remainingQuota.apiCalls,
					warning: quotaStatus.warningThresholds.apiCalls,
				},
				'compute-minutes': {
					current: quotaStatus.usage.computeMinutes,
					limit: quotaStatus.plan?.computeMinutesPerMonth || 0,
					remaining: quotaStatus.remainingQuota.computeMinutes,
					warning: quotaStatus.warningThresholds.computeMinutes,
				},
				storage: {
					current: quotaStatus.usage.storageMB,
					limit: quotaStatus.plan?.storageMBLimit || 0,
					remaining: quotaStatus.remainingQuota.storage,
					warning: quotaStatus.warningThresholds.storage,
				},
			};

			const currentQuota = quotaTypeMap[options.usageType];

			// Proceed with the request
			const response = await handler(req, user);

			// Track usage after successful request if enabled
			if (options.trackUsage && response.status < 400) {
				try {
					const usageTypeMapping = {
						'api-calls': 'api_call',
						'compute-minutes': 'compute_minute',
						storage: 'storage_mb',
					} as const;
					await usageService.trackUsage(
						user.uid,
						usageTypeMapping[options.usageType],
						options.amount,
						{
							endpoint: new URL(req.url).pathname,
							operation: req.method,
							details: {
								timestamp: new Date().toISOString(),
								...options.metadata,
							},
						}
					);
				} catch (trackingError) {
					console.error('Error tracking usage:', trackingError);
					// Don't fail the request if usage tracking fails
				}
			}

			// Add quota information to response headers
			if (currentQuota) {
				response.headers.set('X-Quota-Current', currentQuota.current.toString());
				response.headers.set('X-Quota-Limit', currentQuota.limit.toString());
				response.headers.set('X-Quota-Remaining', currentQuota.remaining.toString());
				response.headers.set('X-Quota-Warning', currentQuota.warning.toString());
			}

			return response;
		} catch (error) {
			console.error('Error in quota enforcement middleware:', error);
			// In case of middleware errors, allow the request to proceed
			// but log the error for investigation
			await FirestoreService.logAudit({
				userId: user.uid,
				action: 'QUOTA_MIDDLEWARE_ERROR',
				resource: 'quota',
				resourceId: 'middleware',
				details: {
					action: 'Quota middleware encountered an error',
					error: error instanceof Error ? error.message : 'Unknown error',
					endpoint: new URL(req.url).pathname,
					method: req.method,
				},
			});

			return await handler(req, user);
		}
	};
}

/**
 * Helper function to check quotas without enforcement (for informational purposes)
 */
export async function checkUserQuota(
	userId: string,
	usageType: 'api-calls' | 'compute-minutes' | 'storage',
	amount: number = 0
): Promise<QuotaEnforcementResult> {
	try {
		const usageService = new UsageTrackingService();
		const [canPerform, quotaStatus] = await Promise.all([
			usageService.canUserPerformAction(userId, usageType, amount),
			usageService.checkQuotaStatus(userId),
		]);

		const quotaTypeMap = {
			'api-calls': {
				current: quotaStatus.usage.apiCalls,
				limit: quotaStatus.plan?.apiCallsPerMonth || 0,
				remaining: quotaStatus.remainingQuota.apiCalls,
				warning: quotaStatus.warningThresholds.apiCalls,
			},
			'compute-minutes': {
				current: quotaStatus.usage.computeMinutes,
				limit: quotaStatus.plan?.computeMinutesPerMonth || 0,
				remaining: quotaStatus.remainingQuota.computeMinutes,
				warning: quotaStatus.warningThresholds.computeMinutes,
			},
			storage: {
				current: quotaStatus.usage.storageMB,
				limit: quotaStatus.plan?.storageMBLimit || 0,
				remaining: quotaStatus.remainingQuota.storage,
				warning: quotaStatus.warningThresholds.storage,
			},
		};

		const currentQuota = quotaTypeMap[usageType];

		return {
			allowed: canPerform,
			quotaStatus: currentQuota,
			remainingQuota: currentQuota?.remaining || 0,
			warningThreshold: currentQuota?.warning || false,
		};
	} catch (error) {
		console.error('Error checking user quota:', error);
		return {
			allowed: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

/**
 * Middleware specifically for API endpoints that consume API call quotas
 */
export function withApiCallQuota(callsConsumed: number = 1, metadata: Record<string, any> = {}) {
	return (handler: (req: NextRequest, user: UserDocument) => Promise<NextResponse>) =>
		withQuotaEnforcement(
			{
				usageType: 'api-calls',
				amount: callsConsumed,
				trackUsage: true,
				metadata,
			},
			handler
		);
}

/**
 * Middleware specifically for compute-intensive operations
 */
export function withComputeQuota(computeMinutes: number, metadata: Record<string, any> = {}) {
	return (handler: (req: NextRequest, user: UserDocument) => Promise<NextResponse>) =>
		withQuotaEnforcement(
			{
				usageType: 'compute-minutes',
				amount: computeMinutes,
				trackUsage: true,
				metadata,
			},
			handler
		);
}

/**
 * Middleware specifically for storage operations
 */
export function withStorageQuota(storageMB: number, metadata: Record<string, any> = {}) {
	return (handler: (req: NextRequest, user: UserDocument) => Promise<NextResponse>) =>
		withQuotaEnforcement(
			{
				usageType: 'storage',
				amount: storageMB,
				trackUsage: true,
				metadata,
			},
			handler
		);
}
