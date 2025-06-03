import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2024-04-10',
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
	try {
		const { priceId, mode = 'subscription', successUrl, cancelUrl } = await request.json();

		if (!priceId) {
			return NextResponse.json(
				{ error: 'Price ID is required' },
				{ status: 400 }
			);
		}

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: [
				{
					price: priceId,
					quantity: 1,
				},
			],
			mode: mode,
			success_url: successUrl,
			cancel_url: cancelUrl,
			automatic_tax: { enabled: true },
			customer_creation: 'always',
			billing_address_collection: 'required',
			metadata: {
				source: 'aide-landing',
			},
		});

		return NextResponse.json({
			sessionId: session.id,
			url: session.url,
		});
	} catch (error) {
		console.error('Error creating checkout session:', error);
		return NextResponse.json(
			{ error: 'Failed to create checkout session' },
			{ status: 500 }
		);
	}
}
