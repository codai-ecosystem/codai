/**
 * User Registration API Endpoint
 * Allows creating test users for development and testing purposes
 */
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, COLLECTIONS } from '../../../lib/firebase-admin';

export async function POST(request: NextRequest) {
	try {
		const { email, password, displayName = 'Test User', role = 'user', plan = 'free' } = await request.json();

		// Validate input
		if (!email || !password) {
			return NextResponse.json(
				{ error: 'Email and password are required' },
				{ status: 400 }
			);
		}

		// Check if this is a development environment or if we're allowing test user creation
		const isDevOrTestMode = process.env.NODE_ENV === 'development' ||
			process.env.ALLOW_TEST_USERS === 'true' ||
			email.includes('@aide-dev.com');

		if (!isDevOrTestMode) {
			return NextResponse.json(
				{ error: 'User registration is not available in production' },
				{ status: 403 }
			);
		}

		// Create user in Firebase Auth
		const userRecord = await adminAuth.createUser({
			email,
			password,
			displayName,
			emailVerified: true, // Auto-verify for test users
		});

		// Create user document in Firestore
		const userDocument = {
			uid: userRecord.uid,
			email: userRecord.email!,
			displayName: displayName || userRecord.displayName,
			role,
			plan,
			subscriptionStatus: 'active',
			createdAt: new Date(),
			updatedAt: new Date(),
			isTestUser: true,
		};

		await adminDb.collection(COLLECTIONS.USERS).doc(userRecord.uid).set(userDocument);

		console.log(`Test user created: ${email} (${userRecord.uid})`);

		return NextResponse.json({
			success: true,
			user: {
				uid: userRecord.uid,
				email: userRecord.email,
				displayName: userRecord.displayName,
				role,
				plan,
			},
		});

	} catch (error: any) {
		console.error('Error creating test user:', error);

		// Handle specific Firebase errors
		if (error.code === 'auth/email-already-exists') {
			return NextResponse.json(
				{ error: 'User with this email already exists' },
				{ status: 409 }
			);
		}

		return NextResponse.json(
			{ error: 'Failed to create user', details: error.message },
			{ status: 500 }
		);
	}
}

// GET endpoint to check if test user creation is available
export async function GET() {
	const isDevOrTestMode = process.env.NODE_ENV === 'development' ||
		process.env.ALLOW_TEST_USERS === 'true';

	return NextResponse.json({
		testUserCreationAvailable: isDevOrTestMode,
		environment: process.env.NODE_ENV,
		message: isDevOrTestMode
			? 'Test user creation is available'
			: 'Test user creation is disabled in production'
	});
}
