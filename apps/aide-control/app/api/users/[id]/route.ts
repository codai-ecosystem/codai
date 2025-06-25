/**
 * API route for individual user management
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../lib/auth-middleware';
import {
	FirestoreService,
	adminAuth,
	adminDb,
	type UserDocument,
} from '../../../../lib/firebase-admin';

/**
 * GET /api/users/[id] - Get a specific user (admin only)
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withAdminAuth(async (request, user) => {
		try {
			const { id: userId } = await params;

			// Get user document from Firestore
			const userDoc = await FirestoreService.getUserDocument(userId);
			if (!userDoc) {
				return NextResponse.json({ error: 'User not found' }, { status: 404 });
			}

			// Log audit entry
			await FirestoreService.logAudit({
				userId: user.uid,
				action: 'VIEW_USER',
				resource: 'user',
				resourceId: userId,
				details: {
					action: 'Viewed user profile',
					targetEmail: userDoc.email,
					targetRole: userDoc.role,
				},
			});

			// Remove sensitive data before returning
			const { stripeCustomerId, ...safeUserData } = userDoc;

			return NextResponse.json({
				success: true,
				user: {
					id: userId,
					...safeUserData,
				},
			});
		} catch (error) {
			console.error('Error getting user:', error);
			return NextResponse.json({ error: 'Failed to retrieve user' }, { status: 500 });
		}
	})(req);
}

/**
 * PUT /api/users/[id] - Update a specific user (admin only)
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withAdminAuth(async (request, user) => {
		try {
			const { id: userId } = await params;
			const updateData = await request.json();

			// Validate user exists
			const existingUser = await FirestoreService.getUserDocument(userId);
			if (!existingUser) {
				return NextResponse.json({ error: 'User not found' }, { status: 404 });
			}

			// Validate update data
			const allowedFields = ['displayName', 'email', 'role', 'status', 'plan'];
			const filteredData: Partial<UserDocument> = {};

			for (const field of allowedFields) {
				if (updateData[field] !== undefined) {
					(filteredData as any)[field] = updateData[field];
				}
			}

			// Prevent role escalation beyond current user's level
			if (filteredData.role) {
				const currentUserRole = user.role;
				const targetRole = filteredData.role;

				// Only superadmin can create other superadmins
				if (targetRole === 'superadmin' && currentUserRole !== 'superadmin') {
					return NextResponse.json(
						{ error: 'Insufficient permissions to assign superadmin role' },
						{ status: 403 }
					);
				}

				// Admin can't promote to admin if they're not superadmin
				if (targetRole === 'admin' && currentUserRole !== 'superadmin') {
					return NextResponse.json(
						{ error: 'Insufficient permissions to assign admin role' },
						{ status: 403 }
					);
				}
			}

			// Update user document
			filteredData.updatedAt = new Date();
			await FirestoreService.setUserDocument(userId, filteredData);

			// Update Firebase Auth profile if email or displayName changed
			if (filteredData.email || filteredData.displayName) {
				const authUpdate: any = {};
				if (filteredData.email) authUpdate.email = filteredData.email;
				if (filteredData.displayName) authUpdate.displayName = filteredData.displayName;

				await adminAuth.updateUser(userId, authUpdate);
			}

			// Log audit entry
			await FirestoreService.logAudit({
				userId: user.uid,
				action: 'UPDATE_USER',
				resource: 'user',
				resourceId: userId,
				details: {
					action: 'Updated user profile',
					updatedFields: Object.keys(filteredData),
					previousEmail: existingUser.email,
					newEmail: filteredData.email || existingUser.email,
				},
			});

			// Get updated user data
			const updatedUser = await FirestoreService.getUserDocument(userId);
			const { stripeCustomerId, ...safeUserData } = updatedUser!;

			return NextResponse.json({
				success: true,
				message: 'User updated successfully',
				user: {
					id: userId,
					...safeUserData,
				},
			});
		} catch (error) {
			console.error('Error updating user:', error);
			return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
		}
	})(req);
}

/**
 * DELETE /api/users/[id] - Delete a specific user (admin only)
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withAdminAuth(async (request, user) => {
		try {
			const { id: userId } = await params;

			// Don't allow deleting yourself
			if (userId === user.uid) {
				return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 403 });
			}

			// Validate user exists
			const existingUser = await FirestoreService.getUserDocument(userId);
			if (!existingUser) {
				return NextResponse.json({ error: 'User not found' }, { status: 404 });
			}

			// Prevent deleting superadmin unless you are superadmin
			if (existingUser.role === 'superadmin' && user.role !== 'superadmin') {
				return NextResponse.json(
					{ error: 'Insufficient permissions to delete superadmin user' },
					{ status: 403 }
				);
			}

			// Delete user from Firebase Auth
			await adminAuth.deleteUser(userId);

			// Delete user document from Firestore
			await adminDb.collection('users').doc(userId).delete();

			// Log audit entry
			await FirestoreService.logAudit({
				userId: user.uid,
				action: 'DELETE_USER',
				resource: 'user',
				resourceId: userId,
				details: {
					action: 'Deleted user account',
					deletedUserEmail: existingUser.email,
					deletedUserRole: existingUser.role,
				},
			});

			return NextResponse.json({
				success: true,
				message: 'User deleted successfully',
			});
		} catch (error) {
			console.error('Error deleting user:', error);
			return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
		}
	})(req);
}
