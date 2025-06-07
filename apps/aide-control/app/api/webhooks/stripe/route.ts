/**
 * Stripe webhook handler for processing billing events
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminApp } from '../../../../lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2024-04-10',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
	try {
		const body = await req.text();
		const signature = req.headers.get('stripe-signature')!;

		let event: Stripe.Event;

		try {
			event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
		} catch (err) {
			console.error('Webhook signature verification failed:', err);
			return NextResponse.json(
				{ error: 'Invalid signature' },
				{ status: 400 }
			);
		} const admin = getAdminApp();
		const db = (admin as any).firestore();

		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object as Stripe.Checkout.Session;
				await handleCheckoutCompleted(db, session);
				break;
			}

			case 'customer.subscription.created':
			case 'customer.subscription.updated': {
				const subscription = event.data.object as Stripe.Subscription;
				await handleSubscriptionChange(db, subscription);
				break;
			}

			case 'customer.subscription.deleted': {
				const subscription = event.data.object as Stripe.Subscription;
				await handleSubscriptionCanceled(db, subscription);
				break;
			}

			case 'invoice.payment_succeeded': {
				const invoice = event.data.object as Stripe.Invoice;
				await handlePaymentSucceeded(db, invoice);
				break;
			}

			case 'invoice.payment_failed': {
				const invoice = event.data.object as Stripe.Invoice;
				await handlePaymentFailed(db, invoice);
				break;
			}

			case 'customer.created': {
				const customer = event.data.object as Stripe.Customer;
				await handleCustomerCreated(db, customer);
				break;
			}

			default:
				console.log(`Unhandled event type: ${event.type}`);
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		console.error('Webhook error:', error);
		return NextResponse.json(
			{ error: 'Webhook processing failed' },
			{ status: 500 }
		);
	}
}

async function handleCheckoutCompleted(
	db: any,
	session: Stripe.Checkout.Session
) {
	const { customer, subscription, metadata } = session;
	const userId = metadata?.userId;

	if (!userId) {
		console.error('No userId in checkout session metadata');
		return;
	}

	try {
		// Update user record with customer ID and subscription
		await db.collection('users').doc(userId).update({
			stripeCustomerId: customer,
			stripeSubscriptionId: subscription,
			subscriptionStatus: 'active',
			updatedAt: new Date().toISOString(),
		});

		// Create billing record
		await db.collection('billing').doc(userId).set({
			customerId: customer,
			subscriptionId: subscription,
			status: 'active',
			checkoutSessionId: session.id,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		console.log(`Checkout completed for user ${userId}`);
	} catch (error) {
		console.error('Error handling checkout completion:', error);
	}
}

async function handleSubscriptionChange(
	db: any,
	subscription: Stripe.Subscription
) {
	const customerId = subscription.customer as string;

	try {
		// Find user by customer ID
		const usersSnapshot = await db
			.collection('users')
			.where('stripeCustomerId', '==', customerId)
			.get();

		if (usersSnapshot.empty) {
			console.error(`No user found for customer ${customerId}`);
			return;
		}

		const userDoc = usersSnapshot.docs[0];
		const userId = userDoc.id;

		// Update subscription details
		await db.collection('users').doc(userId).update({
			stripeSubscriptionId: subscription.id,
			subscriptionStatus: subscription.status,
			currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
			updatedAt: new Date().toISOString(),
		});

		// Update billing record
		await db.collection('billing').doc(userId).update({
			subscriptionId: subscription.id,
			status: subscription.status,
			currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
			updatedAt: new Date().toISOString(),
		});

		console.log(`Subscription updated for user ${userId}: ${subscription.status}`);
	} catch (error) {
		console.error('Error handling subscription change:', error);
	}
}

async function handleSubscriptionCanceled(
	db: any,
	subscription: Stripe.Subscription
) {
	const customerId = subscription.customer as string;

	try {
		// Find user by customer ID
		const usersSnapshot = await db
			.collection('users')
			.where('stripeCustomerId', '==', customerId)
			.get();

		if (usersSnapshot.empty) {
			console.error(`No user found for customer ${customerId}`);
			return;
		}

		const userDoc = usersSnapshot.docs[0];
		const userId = userDoc.id;

		// Update user to free tier
		await db.collection('users').doc(userId).update({
			subscriptionStatus: 'canceled',
			planId: 'free',
			updatedAt: new Date().toISOString(),
		});

		// Update billing record
		await db.collection('billing').doc(userId).update({
			status: 'canceled',
			canceledAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		console.log(`Subscription canceled for user ${userId}`);
	} catch (error) {
		console.error('Error handling subscription cancellation:', error);
	}
}

async function handlePaymentSucceeded(
	db: any,
	invoice: Stripe.Invoice
) {
	const customerId = invoice.customer as string;

	try {
		// Find user by customer ID
		const usersSnapshot = await db
			.collection('users')
			.where('stripeCustomerId', '==', customerId)
			.get();

		if (usersSnapshot.empty) {
			console.error(`No user found for customer ${customerId}`);
			return;
		}

		const userDoc = usersSnapshot.docs[0];
		const userId = userDoc.id;

		// Reset usage for the new billing period
		await db.collection('users').doc(userId).collection('usage').doc('current').set({
			apiCalls: 0,
			computeMinutes: 0,
			storageUsed: 0,
			resetAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		console.log(`Payment succeeded and usage reset for user ${userId}`);
	} catch (error) {
		console.error('Error handling payment success:', error);
	}
}

async function handlePaymentFailed(
	db: any,
	invoice: Stripe.Invoice
) {
	const customerId = invoice.customer as string;

	try {
		// Find user by customer ID
		const usersSnapshot = await db
			.collection('users')
			.where('stripeCustomerId', '==', customerId)
			.get();

		if (usersSnapshot.empty) {
			console.error(`No user found for customer ${customerId}`);
			return;
		}

		const userDoc = usersSnapshot.docs[0];
		const userId = userDoc.id;

		// Mark payment as failed - could trigger email notification
		await db.collection('users').doc(userId).update({
			paymentStatus: 'failed',
			lastPaymentFailure: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		console.log(`Payment failed for user ${userId}`);
	} catch (error) {
		console.error('Error handling payment failure:', error);
	}
}

async function handleCustomerCreated(
	db: any,
	customer: Stripe.Customer
) {
	console.log(`New Stripe customer created: ${customer.id}`);
	// Additional customer setup logic can be added here
}
