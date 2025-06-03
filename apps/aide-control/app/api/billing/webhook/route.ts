/**
 * Stripe Webhook Endpoint
 * Handles Stripe webhook events for billing operations
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb, COLLECTIONS } from '../../../../lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2024-04-10'
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
	try {
		const body = await request.text();
		const signature = request.headers.get('stripe-signature')!;

		// Verify webhook signature
		let event: Stripe.Event;
		try {
			event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
		} catch (err) {
			console.error('Webhook signature verification failed:', err);
			return NextResponse.json(
				{ error: 'Invalid signature' },
				{ status: 400 }
			);
		}

		console.log('Received Stripe webhook event:', event.type);

		// Handle the event
		switch (event.type) {
			case 'checkout.session.completed':
				await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
				break;

			case 'customer.subscription.created':
			case 'customer.subscription.updated':
				await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
				break;

			case 'customer.subscription.deleted':
				await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
				break;

			case 'invoice.payment_succeeded':
				await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
				break;

			case 'invoice.payment_failed':
				await handlePaymentFailed(event.data.object as Stripe.Invoice);
				break;

			default:
				console.log(`Unhandled event type: ${event.type}`);
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		console.error('Webhook error:', error);
		return NextResponse.json(
			{ error: 'Webhook handler failed' },
			{ status: 500 }
		);
	}
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
	try {
		const { customer, subscription, metadata } = session;
		const userId = metadata?.userId;

		if (!userId) {
			console.error('No userId in checkout session metadata');
			return;
		}

		// Update user's subscription status
		await adminDb.collection(COLLECTIONS.USERS).doc(userId).update({
			stripeCustomerId: customer,
			stripeSubscriptionId: subscription,
			subscriptionStatus: 'active',
			subscriptionStartDate: new Date(),
			updatedAt: new Date()
		});

		console.log(`Checkout completed for user ${userId}, subscription ${subscription}`);
	} catch (error) {
		console.error('Error handling checkout completion:', error);
	}
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
	try {
		const customerId = subscription.customer as string;

		// Find user by Stripe customer ID
		const userQuery = await adminDb.collection(COLLECTIONS.USERS)
			.where('stripeCustomerId', '==', customerId)
			.limit(1)
			.get();

		if (userQuery.empty) {
			console.error('No user found for Stripe customer:', customerId);
			return;
		}

		const userDoc = userQuery.docs[0];
		const updateData: any = {
			subscriptionStatus: subscription.status,
			updatedAt: new Date()
		};

		// Add plan information if available
		if (subscription.items.data[0]?.price?.id) {
			updateData.stripePriceId = subscription.items.data[0].price.id;
		}

		// Add current period end
		if (subscription.current_period_end) {
			updateData.subscriptionEndDate = new Date(subscription.current_period_end * 1000);
		}

		await userDoc.ref.update(updateData);

		console.log(`Subscription updated for customer ${customerId}:`, subscription.status);
	} catch (error) {
		console.error('Error handling subscription update:', error);
	}
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
	try {
		const customerId = subscription.customer as string;

		// Find user by Stripe customer ID
		const userQuery = await adminDb.collection(COLLECTIONS.USERS)
			.where('stripeCustomerId', '==', customerId)
			.limit(1)
			.get();

		if (userQuery.empty) {
			console.error('No user found for Stripe customer:', customerId);
			return;
		}

		const userDoc = userQuery.docs[0];
		await userDoc.ref.update({
			subscriptionStatus: 'cancelled',
			subscriptionEndDate: new Date(),
			updatedAt: new Date()
		});

		console.log(`Subscription cancelled for customer ${customerId}`);
	} catch (error) {
		console.error('Error handling subscription deletion:', error);
	}
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
	try {
		const customerId = invoice.customer as string;

		// Find user by Stripe customer ID
		const userQuery = await adminDb.collection(COLLECTIONS.USERS)
			.where('stripeCustomerId', '==', customerId)
			.limit(1)
			.get();

		if (userQuery.empty) {
			console.error('No user found for Stripe customer:', customerId);
			return;
		}

		const userDoc = userQuery.docs[0];

		// Log successful payment
		await adminDb.collection(COLLECTIONS.PAYMENTS).add({
			userId: userDoc.id,
			stripeInvoiceId: invoice.id,
			amount: invoice.amount_paid,
			currency: invoice.currency,
			status: 'succeeded',
			createdAt: new Date()
		});

		// Update user's last payment date
		await userDoc.ref.update({
			lastPaymentDate: new Date(),
			updatedAt: new Date()
		});

		console.log(`Payment succeeded for customer ${customerId}, amount: ${invoice.amount_paid}`);
	} catch (error) {
		console.error('Error handling payment success:', error);
	}
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
	try {
		const customerId = invoice.customer as string;

		// Find user by Stripe customer ID
		const userQuery = await adminDb.collection(COLLECTIONS.USERS)
			.where('stripeCustomerId', '==', customerId)
			.limit(1)
			.get();

		if (userQuery.empty) {
			console.error('No user found for Stripe customer:', customerId);
			return;
		}

		const userDoc = userQuery.docs[0];

		// Log failed payment
		await adminDb.collection(COLLECTIONS.PAYMENTS).add({
			userId: userDoc.id,
			stripeInvoiceId: invoice.id,
			amount: invoice.amount_due,
			currency: invoice.currency,
			status: 'failed',
			createdAt: new Date()
		});

		// Update subscription status if payment failed
		await userDoc.ref.update({
			subscriptionStatus: 'past_due',
			updatedAt: new Date()
		});

		console.log(`Payment failed for customer ${customerId}, amount: ${invoice.amount_due}`);
	} catch (error) {
		console.error('Error handling payment failure:', error);
	}
}
