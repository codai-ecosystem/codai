/**
 * Admin Dashboard API - Provides system-wide statistics and management data
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../lib/auth-middleware';
import { FirestoreService, type UserDocument } from '../../../../lib/firebase-admin';
import { UsageTrackingService } from '../../../../lib/services/usage-tracking';
import { BackendProvisioningService } from '../../../../lib/services/backend-provisioning';

/**
 * GET /api/admin/dashboard - Get dashboard statistics (admin only)
 */
export async function GET(req: NextRequest) {
	return withAdminAuth(async (request, adminUser) => {
		try {
			const usageService = new UsageTrackingService();
			const provisioningService = new BackendProvisioningService();

			// Get system-wide statistics
			const [systemStats, recentActivity] = await Promise.all([
				usageService.getSystemStats(),
				FirestoreService.getRecentAuditLogs(20),
			]);

			// Log admin dashboard access
			await FirestoreService.logAudit({
				userId: adminUser.uid,
				action: 'VIEW_DASHBOARD',
				resource: 'admin',
				resourceId: 'dashboard',
				details: {
					action: 'Accessed admin dashboard',
					timestamp: new Date().toISOString(),
				},
			});

			return NextResponse.json({
				success: true,
				data: {
					system: systemStats,
					activity: recentActivity,
				},
			});
		} catch (error) {
			console.error('Error getting dashboard data:', error);
			return NextResponse.json(
				{
					error: 'Failed to retrieve dashboard data',
					details: error instanceof Error ? error.message : 'Unknown error',
				},
				{ status: 500 }
			);
		}
	})(req);
}

/**
 * Supported admin actions
 */
type AdminAction = 'reset_user_quotas' | 'bulk_provision_users' | 'cleanup_inactive_resources';

/**
 * Interface for admin action payloads
 */
interface ResetUserQuotasPayload {
	userId: string;
}

interface BulkProvisionUsersPayload {
	userIds: string[];
	services?: ('github' | 'firebase')[];
}

interface CleanupResourcesPayload {
	olderThan?: number; // days
}

/**
 * Interface for admin action results
 */
interface AdminActionResult {
	message: string;
	[key: string]: any;
}

/**
 * POST /api/admin/dashboard/actions - Perform admin actions (admin only)
 */
export async function POST(req: NextRequest) {
	return withAdminAuth(async (request, adminUser) => {
		try {
			const body = await request.json();
			const action = body.action as AdminAction;
			const payload = body.payload;

			if (!action) {
				return NextResponse.json({ error: 'Action is required' }, { status: 400 });
			}

			const usageService = new UsageTrackingService();
			const provisioningService = new BackendProvisioningService();
			let result: AdminActionResult;

			// Handle different admin actions
			switch (action) {
				case 'reset_user_quotas':
					result = await handleResetUserQuotas(usageService, payload as ResetUserQuotasPayload);
					break;

				case 'bulk_provision_users':
					result = await handleBulkProvisionUsers(
						provisioningService,
						payload as BulkProvisionUsersPayload
					);
					break;

				case 'cleanup_inactive_resources':
					result = handleCleanupResources(payload as CleanupResourcesPayload);
					break;

				default:
					return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
			}

			// Log admin action
			await FirestoreService.logAudit({
				userId: adminUser.uid,
				action: 'ADMIN_ACTION',
				resource: 'admin',
				resourceId: action,
				details: {
					action: `Performed admin action: ${action}`,
					payload,
					result,
				},
			});

			return NextResponse.json({
				success: true,
				...result,
			});
		} catch (error) {
			console.error('Error performing admin action:', error);
			return NextResponse.json(
				{
					error: 'Failed to perform admin action',
					details: error instanceof Error ? error.message : 'Unknown error',
				},
				{ status: 500 }
			);
		}
	})(req);
}

/**
 * Handle resetting user quotas
 */
async function handleResetUserQuotas(
	usageService: UsageTrackingService,
	payload: ResetUserQuotasPayload
): Promise<AdminActionResult> {
	if (!payload?.userId) {
		throw new Error('User ID is required for quota reset');
	}

	await usageService.resetUserQuotas(payload.userId);
	return { message: 'User quotas reset successfully' };
}

/**
 * Handle bulk provisioning of users
 */
async function handleBulkProvisionUsers(
	provisioningService: BackendProvisioningService,
	payload: BulkProvisionUsersPayload
): Promise<AdminActionResult> {
	if (!payload?.userIds || !Array.isArray(payload.userIds)) {
		throw new Error('User IDs array is required for bulk provisioning');
	}

	const provisioningResults = await Promise.all(
		payload.userIds.map(async (userId: string) => {
			try {
				const userDoc = await FirestoreService.getUserDocument(userId);
				if (!userDoc) {
					return { userId, success: false, error: 'User not found' };
				}

				const result = await provisioningService.provisionUser({
					userId,
					email: userDoc.email,
					displayName: userDoc.displayName || userDoc.email,
					plan: userDoc.plan as 'free' | 'professional' | 'enterprise',
					services: payload.services || ['github'],
					projectName: `${userDoc.displayName || 'User'}'s Project`,
					projectId: `user-${userId}-${Date.now()}`,
					projectType: 'nextjs', // Default project type
					environmentType: 'development',
				});

				return { userId, success: result.success, errors: result.errors };
			} catch (error: any) {
				return { userId, success: false, error: error.message };
			}
		})
	);

	return {
		message: 'Bulk provisioning completed',
		results: provisioningResults,
	};
}

/**
 * Handle cleanup of inactive resources
 * Note: This is currently a placeholder for future implementation
 */
function handleCleanupResources(payload: CleanupResourcesPayload): AdminActionResult {
	// TODO: Implement resource cleanup logic
	return {
		message: 'Resource cleanup initiated (not implemented yet)',
		details: 'This feature will be implemented in a future update',
	};
}
