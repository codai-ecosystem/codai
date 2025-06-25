/**
 * API route for retrieving user usage data
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../../lib/server/auth-middleware';
import { withAdminAuth } from '../../../../../lib/auth-middleware';
import { FirestoreService } from '../../../../../lib/firebase-admin';
import { UsageTrackingService } from '../../../../../lib/services/usage-tracking';

/**
 * GET /api/users/[id]/usage - Get usage records and limits for a specific user
 */
export function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withAuth(async (req, { uid: currentUid }) => {
		try {
			const { id: userId } = await params;

			// Only allow users to access their own data unless they're an admin
			if (currentUid !== userId) {
				// Check if requesting user is an admin
				const adminUserData = await FirestoreService.getUserDocument(currentUid);
				if (!adminUserData || adminUserData.role !== 'admin') {
					return NextResponse.json(
						{ error: 'Not authorized to access this resource' },
						{ status: 403 }
					);
				}
			}

			// Parse query parameters
			const url = new URL(req.url);
			const startDate = url.searchParams.get('start')
				? new Date(url.searchParams.get('start')!)
				: null;
			const endDate = url.searchParams.get('end') ? new Date(url.searchParams.get('end')!) : null;
			const includeQuotas = url.searchParams.get('quotas') === 'true';

			// Initialize usage tracking service
			const usageService = new UsageTrackingService();

			// Get current usage and plan limits
			const [currentUsage, quotaStatus] = await Promise.all([
				usageService.getCurrentUsage(userId),
				includeQuotas ? usageService.checkQuotaStatus(userId) : Promise.resolve(null),
			]);
			// Get detailed usage records if date range is specified
			let detailedUsage = null;
			if (startDate || endDate) {
				detailedUsage = await usageService.getUsageHistory(userId, {
					startDate: startDate?.toISOString(),
					endDate: endDate?.toISOString(),
					limit: 100,
				});
			}

			const response: any = {
				currentUsage,
				summary: {
					apiCalls: {
						current: currentUsage.apiCalls,
						remaining: quotaStatus?.apiCalls.remaining || 0,
						warning: quotaStatus?.apiCalls.warning || false,
					},
					computeMinutes: {
						current: currentUsage.computeMinutes,
						remaining: quotaStatus?.computeMinutes.remaining || 0,
						warning: quotaStatus?.computeMinutes.warning || false,
					},
					storage: {
						current: currentUsage.storageMB,
						remaining: quotaStatus?.storage.remaining || 0,
						warning: quotaStatus?.storage.warning || false,
					},
				},
			};

			if (includeQuotas && quotaStatus) {
				response.quotas = quotaStatus;
			}

			if (detailedUsage) {
				response.history = detailedUsage;
			}

			return NextResponse.json(response);
		} catch (error) {
			console.error('Error getting usage data:', error);
			return NextResponse.json({ error: 'Failed to retrieve usage data' }, { status: 500 });
		}
	})(req);
}

/**
 * POST /api/users/[id]/usage - Track new usage event (internal/admin only)
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withAdminAuth(async (request, adminUser) => {
		try {
			const { id: userId } = await params;
			const body = await request.json();

			const { type, amount, metadata } = body;

			if (!type || !amount) {
				return NextResponse.json({ error: 'Usage type and amount are required' }, { status: 400 });
			}

			// Initialize usage tracking service
			const usageService = new UsageTrackingService();

			// Track usage
			await usageService.trackUsage(userId, type, amount, metadata);

			// Log audit entry
			await FirestoreService.logAudit({
				userId: adminUser.uid,
				action: 'TRACK_USAGE',
				resource: 'usage',
				resourceId: userId,
				details: {
					action: 'Tracked usage event',
					usageType: type,
					amount,
					metadata,
				},
			});

			return NextResponse.json({
				success: true,
				message: 'Usage tracked successfully',
			});
		} catch (error) {
			console.error('Error tracking usage:', error);
			return NextResponse.json({ error: 'Failed to track usage' }, { status: 500 });
		}
	})(req);
}
