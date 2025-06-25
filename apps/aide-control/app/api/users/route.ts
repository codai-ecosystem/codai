/**
 * Enhanced User Management API for AIDE Control Panel
 * Provides comprehensive user CRUD operations with role-based access control
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '../../../lib/auth-middleware';
import {
	adminDb,
	adminAuth,
	COLLECTIONS,
	UserDocument,
	FirestoreService,
} from '../../../lib/firebase-admin';

/**
 * GET /api/users - Get all users with pagination and filtering (admin only)
 */
async function handleGetUsers(req: NextRequest, adminUser: UserDocument) {
	try {
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '10');
		const role = searchParams.get('role');
		const status = searchParams.get('status');
		const search = searchParams.get('search');

		let query: any = adminDb.collection(COLLECTIONS.USERS);

		// Apply filters
		if (role) {
			query = query.where('role', '==', role);
		}
		if (status) {
			query = query.where('status', '==', status);
		}

		// Get total count for pagination
		const totalSnapshot = await query.get();
		const total = totalSnapshot.size;

		// Apply pagination
		const offset = (page - 1) * limit;
		let paginatedQuery = query.orderBy('createdAt', 'desc').limit(limit);

		if (offset > 0) {
			const startAfterDoc = await query.orderBy('createdAt', 'desc').limit(offset).get();
			if (!startAfterDoc.empty) {
				const lastDoc = startAfterDoc.docs[startAfterDoc.docs.length - 1];
				paginatedQuery = paginatedQuery.startAfter(lastDoc);
			}
		}

		const snapshot = await paginatedQuery.get();
		let users = snapshot.docs.map(doc => {
			const data = doc.data();
			return {
				id: doc.id,
				uid: data.uid,
				email: data.email,
				displayName: data.displayName,
				role: data.role,
				plan: data.plan,
				createdAt: data.createdAt,
				updatedAt: data.updatedAt,
				lastLoginAt: data.lastLoginAt,
				preferences: data.preferences,
				limits: data.limits,
				status: data.status,
			};
		});

		// Apply search filter (client-side for simplicity)
		if (search) {
			const searchLower = search.toLowerCase();
			users = users.filter(
				user =>
					user.email.toLowerCase().includes(searchLower) ||
					user.displayName?.toLowerCase().includes(searchLower)
			);
		}

		return NextResponse.json({
			users,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error('Error getting users:', error);
		return NextResponse.json({ error: 'Failed to retrieve users' }, { status: 500 });
	}
}

/**
 * POST /api/users - Create a new user (admin only)
 */
async function handleCreateUser(req: NextRequest, adminUser: UserDocument) {
	try {
		const body = await req.json();
		const { email, password, displayName, role = 'user' } = body;

		if (!email || !password) {
			return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
		}

		// Create user in Firebase Auth
		const userRecord = await adminAuth.createUser({
			email,
			password,
			displayName,
		});

		// Create user document in Firestore
		const userData: Partial<UserDocument> = {
			uid: userRecord.uid,
			email,
			displayName: displayName || '',
			role: role as 'user' | 'admin' | 'superadmin',
			plan: 'free', // Default plan
			status: 'active',
			preferences: {
				theme: 'system',
				notifications: true,
				language: 'en',
			},
			limits: {
				tokensPerMonth: 10000,
				projectsMax: 3,
				deploymentsPerMonth: 10,
			},
		};

		await FirestoreService.setUserDocument(userRecord.uid, userData);

		// Log the creation
		await FirestoreService.logAudit({
			userId: adminUser.uid,
			action: 'create_user',
			resource: 'user',
			resourceId: userRecord.uid,
			details: { email, role },
		});

		return NextResponse.json(
			{
				id: userRecord.uid,
				email,
				displayName,
				role,
				status: 'active',
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error creating user:', error);
		return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
	}
}

// Export route handlers with authentication
export const GET = withAdminAuth(handleGetUsers);
export const POST = withAdminAuth(handleCreateUser);
