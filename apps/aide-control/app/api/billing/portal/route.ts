/**
 * API route for creating Stripe customer portal sessions
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminApp } from '../../../../lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2024-04-10',
});

export async function POST(req: NextRequest): Promise<NextResponse> {
	try {
		const { userId } = await req.json();

		if (!userId) {
			return NextResponse.json(
				{ error: 'User ID is required' },
				{ status: 400 }
			);
		}

		const admin = getAdminApp();
		const db = (admin as any).firestore();

		// Get user data
		const userDoc = await db.collection('users').doc(userId).get();
		if (!userDoc.exists) {
			return NextResponse.json(
				{ error: 'User not found' },
				{ status: 404 }
			);
		}

		const userData = userDoc.data();
		const customerId = userData.stripeCustomerId;

		if (!customerId) {
			return NextResponse.json(
				{ error: 'No Stripe customer found for user' },
				{ status: 400 }
			);
		}

		// Create customer portal session
		const session = await stripe.billingPortal.sessions.create({
			customer: customerId,
			return_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/billing`,
		});

		return NextResponse.json({
			url: session.url
		});

	} catch (error) {
		console.error('Error creating customer portal session:', error);
		return NextResponse.json(
			{ error: 'Failed to create customer portal session' },
			{ status: 500 }
		);
	}
}
