/**
 * API route for creating Stripe checkout sessions
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminApp } from '../../../../lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2024-04-10',
});

export async function POST(req: NextRequest): Promise<NextResponse> {
	try {
		const { planId, mode = 'subscription', userId } = await req.json();

		if (!planId) {
			return NextResponse.json(
				{ error: 'Plan ID is required' },
				{ status: 400 }
			);
		}

		if (!userId) {
			return NextResponse.json(
				{ error: 'User ID is required' },
				{ status: 400 }
			);
		}

		const admin = getAdminApp();
		const db = (admin as any).firestore();		// Get user data
		const userDoc = await db.collection('users').doc(userId).get();
		if (!userDoc.exists) {
			return NextResponse.json(
				{ error: 'User not found' },
				{ status: 404 }
			);
		}

		const userData = userDoc.data();

		// Get plan details
		const planDoc = await db.collection('plans').doc(planId).get();
		if (!planDoc.exists) {
			return NextResponse.json(
				{ error: 'Plan not found' },
				{ status: 404 }
			);
		}

		const planData = planDoc.data();

		// Create or get Stripe customer
		let customerId = userData.stripeCustomerId;

		if (!customerId) {
			const customer = await stripe.customers.create({
				email: userData.email,
				name: userData.displayName,
				metadata: {
					userId: userId,
				},
			});
			customerId = customer.id;

			// Update user record with customer ID
			await db.collection('users').doc(userId).update({
				stripeCustomerId: customerId,
				updatedAt: new Date().toISOString(),
			});
		}

		// Create checkout session
		const session = await stripe.checkout.sessions.create({
			customer: customerId,
			payment_method_types: ['card'],
			line_items: [
				{
					price: planData.stripePriceId,
					quantity: 1,
				},
			],
			mode: mode as Stripe.Checkout.SessionCreateParams.Mode,
			success_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/billing/plans`,
			metadata: {
				userId: userId,
				planId: planId,
			},
			subscription_data: mode === 'subscription' ? {
				metadata: {
					userId: userId,
					planId: planId,
				},
			} : undefined,
		});

		return NextResponse.json({
			sessionId: session.id,
			url: session.url
		});

	} catch (error) {
		console.error('Error creating checkout session:', error);
		return NextResponse.json(
			{ error: 'Failed to create checkout session' },
			{ status: 500 }
		);
	}
}
