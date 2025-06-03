import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2024-04-10',
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const sessionId = searchParams.get('session_id');

		if (!sessionId) {
			return NextResponse.json(
				{ error: 'Session ID is required' },
				{ status: 400 }
			);
		}

		const session = await stripe.checkout.sessions.retrieve(sessionId);

		if (session.payment_status === 'paid') {
			// Extract relevant information
			const sessionData = {
				id: session.id,
				customerEmail: session.customer_details?.email,
				amount: session.amount_total ? session.amount_total / 100 : null,
				currency: session.currency,
				plan: session.metadata?.plan || 'Professional',
				billing: session.mode === 'subscription' ? 'Monthly' : 'One-time',
				status: session.payment_status,
			};

			return NextResponse.json(sessionData);
		} else {
			return NextResponse.json(
				{ error: 'Payment not completed' },
				{ status: 400 }
			);
		}
	} catch (error) {
		console.error('Error verifying session:', error);
		return NextResponse.json(
			{ error: 'Failed to verify session' },
			{ status: 500 }
		);
	}
}
