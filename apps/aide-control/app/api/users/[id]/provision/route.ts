/**
 * User Provisioning API - Handles user/project provisioning and plan upgrades
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../../lib/auth-middleware';
import { FirestoreService, type UserDocument } from '../../../../../lib/firebase-admin';
import { BackendProvisioningService } from '../../../../../lib/services/backend-provisioning';

/**
 * POST /api/users/[id]/provision - Provision services for a user
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withAdminAuth(async (request, adminUser) => {
		try {
			const { id: userId } = await params;
			const body = await request.json();

			// Validate request body
			const { services = [], projectName, projectId, environmentType = 'development' } = body;

			if (!Array.isArray(services) || services.length === 0) {
				return NextResponse.json(
					{ error: 'At least one service must be specified' },
					{ status: 400 }
				);
			}

			// Verify user exists
			const userDoc = await FirestoreService.getUserDocument(userId);
			if (!userDoc) {
				return NextResponse.json({ error: 'User not found' }, { status: 404 });
			}

			// Initialize provisioning service
			const provisioningService = new BackendProvisioningService();
			// Provision services
			const result = await provisioningService.provisionUser({
				userId,
				email: userDoc.email,
				displayName: userDoc.displayName || userDoc.email,
				plan: userDoc.plan as 'free' | 'professional' | 'enterprise',
				services,
				projectName: projectName || `${userDoc.displayName || 'User'}'s Project`,
				projectId: projectId || `user-${userId}-${Date.now()}`,
				projectType: 'nextjs', // Default project type
				environmentType,
			});

			// Log audit entry
			await FirestoreService.logAudit({
				userId: adminUser.uid,
				action: 'PROVISION_USER',
				resource: 'user',
				resourceId: userId,
				details: {
					action: 'Provisioned services for user',
					targetEmail: userDoc.email,
					services,
					success: result.success,
					errors: result.errors,
				},
			});

			if (result.success) {
				return NextResponse.json({
					success: true,
					message: 'User provisioned successfully',
					services: result.services,
					projectId: result.projectId,
				});
			} else {
				return NextResponse.json(
					{
						success: false,
						message: 'Provisioning completed with errors',
						services: result.services,
						errors: result.errors,
					},
					{ status: 207 } // Multi-status
				);
			}
		} catch (error) {
			console.error('Error provisioning user:', error);
			return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
		}
	})(req);
}

/**
 * PATCH /api/users/[id]/provision - Upgrade user plan and provision additional resources
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withAdminAuth(async (request, adminUser) => {
		try {
			const { id: userId } = await params;
			const body = await request.json();

			const { newPlan } = body;

			if (!newPlan || !['free', 'professional', 'enterprise'].includes(newPlan)) {
				return NextResponse.json(
					{ error: 'Valid plan must be specified (free, professional, enterprise)' },
					{ status: 400 }
				);
			}

			// Verify user exists
			const userDoc = await FirestoreService.getUserDocument(userId);
			if (!userDoc) {
				return NextResponse.json({ error: 'User not found' }, { status: 404 });
			}

			// Initialize provisioning service
			const provisioningService = new BackendProvisioningService();

			// Upgrade user plan
			const result = await provisioningService.upgradeUserPlan(userId, newPlan);

			// Log audit entry
			await FirestoreService.logAudit({
				userId: adminUser.uid,
				action: 'UPGRADE_USER_PLAN',
				resource: 'user',
				resourceId: userId,
				details: {
					action: 'Upgraded user plan',
					targetEmail: userDoc.email,
					oldPlan: userDoc.plan,
					newPlan,
					success: result.success,
					errors: result.errors,
				},
			});

			if (result.success) {
				return NextResponse.json({
					success: true,
					message: 'User plan upgraded successfully',
					services: result.services,
				});
			} else {
				return NextResponse.json(
					{
						success: false,
						message: 'Plan upgrade completed with errors',
						services: result.services,
						errors: result.errors,
					},
					{ status: 207 } // Multi-status
				);
			}
		} catch (error) {
			console.error('Error upgrading user plan:', error);
			return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
		}
	})(req);
}

/**
 * DELETE /api/users/[id]/provision - Deprovision user resources
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withAdminAuth(async (request, adminUser) => {
		try {
			const { id: userId } = await params;

			// Verify user exists
			const userDoc = await FirestoreService.getUserDocument(userId);
			if (!userDoc) {
				return NextResponse.json({ error: 'User not found' }, { status: 404 });
			}

			// Initialize provisioning service
			const provisioningService = new BackendProvisioningService();

			// Deprovision user
			const result = await provisioningService.deprovisionUser(userId);

			// Log audit entry
			await FirestoreService.logAudit({
				userId: adminUser.uid,
				action: 'DEPROVISION_USER',
				resource: 'user',
				resourceId: userId,
				details: {
					action: 'Deprovisioned user resources',
					targetEmail: userDoc.email,
					success: result.success,
					errors: result.errors,
				},
			});

			if (result.success) {
				return NextResponse.json({
					success: true,
					message: 'User deprovisioned successfully',
				});
			} else {
				return NextResponse.json(
					{
						success: false,
						message: 'Deprovisioning completed with errors',
						errors: result.errors,
					},
					{ status: 207 } // Multi-status
				);
			}
		} catch (error) {
			console.error('Error deprovisioning user:', error);
			return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
		}
	})(req);
}
