/**
 * Authentication and authorization middleware for AIDE Control Panel
 * Provides role-based access control and user verification
 */
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, FirestoreService, UserDocument } from './firebase-admin';

export interface AuthenticatedRequest extends NextRequest {
	user?: UserDocument;
}

/**
 * Verify Firebase ID token and get user data
 */
export async function verifyAuth(request: NextRequest): Promise<UserDocument | null> {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return null;
		}

		const token = authHeader.substring(7);
		const decodedToken = await adminAuth.verifyIdToken(token);

		// Get user document from Firestore
		const userDoc = await FirestoreService.getUserDocument(decodedToken.uid);
		if (!userDoc) {
			return null;
		}

		// Update last login time
		await FirestoreService.setUserDocument(decodedToken.uid, {
			lastLoginAt: new Date(),
		});

		return userDoc;
	} catch (error) {
		console.error('Error verifying auth token:', error);
		return null;
	}
}

/**
 * Check if user has required role
 */
export function hasRole(user: UserDocument, requiredRole: 'user' | 'admin' | 'superadmin'): boolean {
	const roleHierarchy = {
		user: 0,
		admin: 1,
		superadmin: 2,
	};

	const userLevel = roleHierarchy[user.role] ?? -1;
	const requiredLevel = roleHierarchy[requiredRole] ?? -1;

	return userLevel >= requiredLevel;
}

/**
 * Authentication middleware factory
 */
export function withAuth(
	handler: (request: NextRequest, user: UserDocument) => Promise<NextResponse>,
	options: {
		requireRole?: 'user' | 'admin' | 'superadmin';
		requireActive?: boolean;
	} = {}
) {
	return async (request: NextRequest): Promise<NextResponse> => {
		try {
			// Verify authentication
			const user = await verifyAuth(request);
			if (!user) {
				return NextResponse.json(
					{ error: 'Authentication required' },
					{ status: 401 }
				);
			}

			// Check if user is active
			if (options.requireActive !== false && user.status !== 'active') {
				return NextResponse.json(
					{ error: 'Account is not active' },
					{ status: 403 }
				);
			}

			// Check role requirements
			if (options.requireRole && !hasRole(user, options.requireRole)) {
				return NextResponse.json(
					{ error: 'Insufficient permissions' },
					{ status: 403 }
				);
			}

			// Add user to request context
			(request as AuthenticatedRequest).user = user;

			return await handler(request, user);
		} catch (error) {
			console.error('Authentication middleware error:', error);
			return NextResponse.json(
				{ error: 'Internal server error' },
				{ status: 500 }
			);
		}
	};
}

/**
 * Admin-only middleware
 */
export function withAdminAuth(
	handler: (request: NextRequest, user: UserDocument) => Promise<NextResponse>
) {
	return withAuth(handler, { requireRole: 'admin' });
}

/**
 * Superadmin-only middleware
 */
export function withSuperAdminAuth(
	handler: (request: NextRequest, user: UserDocument) => Promise<NextResponse>
) {
	return withAuth(handler, { requireRole: 'superadmin' });
}

/**
 * Extract user info from authenticated request
 */
export function getRequestUser(request: NextRequest): UserDocument | null {
	return (request as AuthenticatedRequest).user || null;
}
