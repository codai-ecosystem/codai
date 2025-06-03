# Stripe Integration for AIDE Control Panel

This document explains the Stripe integration for handling subscriptions and payments in the AIDE Control Panel.

## Overview

The AIDE Control Panel uses Stripe for:

- Subscription management
- One-time payments
- Payment processing
- Invoicing
- Usage-based billing

## Setup Instructions

### 1. Create a Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create a new account if you don't have one
3. Complete the account setup process

### 2. Get API Keys

1. In Stripe Dashboard, go to "Developers" > "API keys"
2. Get the publishable key and secret key
   - Use test keys for development environments
   - Use live keys for production environments

### 3. Set Up Environment Variables

Add these variables to your `.env.local` file:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Set Up Stripe Products and Prices

Create your subscription plans in the Stripe Dashboard:

1. Go to "Products" > "Add Product"
2. Configure the product details
3. Create recurring pricing for each product
   - Set the price amount and billing interval
   - Configure trial periods if needed
4. Note the Price IDs for each plan

### 5. Set Up Webhooks

1. Go to "Developers" > "Webhooks" > "Add Endpoint"
2. Enter your webhook URL: `https://your-domain.com/api/billing/webhook`
3. Select the required events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Get the webhook signing secret and add it to your environment variables

## Implementation

### 1. Initialize Stripe

```typescript
// lib/stripe.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2024-04-10',
	appInfo: {
		name: 'AIDE Control Panel',
		version: '0.1.0',
	},
});

export default stripe;
```

### 2. Create Checkout Session

```typescript
// app/api/billing/checkout/route.ts
import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { withAuth } from '@/lib/server/auth-middleware';
import { getUserData } from '@/lib/server/firebase-admin';

export const POST = withAuth(async (req, { uid }) => {
	try {
		const { priceId } = await req.json();
		const userData = await getUserData(uid);

		// Create or retrieve the Stripe customer
		let customerId = userData?.stripeCustomerId;
		if (!customerId) {
			// Create a new customer in Stripe
			const customer = await stripe.customers.create({
				email: userData?.email,
				metadata: { userId: uid },
			});
			customerId = customer.id;

			// Save the customer ID to Firestore
			await setUserData(uid, {
				stripeCustomerId: customerId,
				updatedAt: new Date(),
			});
		}

		// Create a checkout session
		const session = await stripe.checkout.sessions.create({
			customer: customerId,
			payment_method_types: ['card'],
			line_items: [
				{
					price: priceId,
					quantity: 1,
				},
			],
			mode: 'subscription',
			success_url: `${process.env.NEXTAUTH_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.NEXTAUTH_URL}/billing/plans`,
			metadata: {
				userId: uid,
			},
		});

		return NextResponse.json({ url: session.url });
	} catch (error) {
		console.error('Error creating checkout session:', error);
		return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
	}
});
```

### 3. Handle Webhooks

```typescript
// app/api/billing/webhook/route.ts
import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { headers } from 'next/headers';
import { getFirestoreDb } from '@/lib/server/firebase-utils';

export async function POST(req: Request) {
	try {
		const body = await req.text();
		const signature = headers().get('stripe-signature') || '';

		// Verify the webhook signature
		const event = stripe.webhooks.constructEvent(
			body,
			signature,
			process.env.STRIPE_WEBHOOK_SECRET!
		);

		const db = getFirestoreDb();

		// Handle the event
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object as Stripe.Checkout.Session;
				const userId = session.metadata?.userId;

				if (userId && session.subscription) {
					// Retrieve the subscription
					const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
					const planId = subscription.items.data[0].price.product as string;

					// Store the subscription in Firestore
					await db.collection('subscriptions').add({
						userId,
						planId,
						stripeSubscriptionId: subscription.id,
						status: subscription.status,
						currentPeriodEnd: new Date(subscription.current_period_end * 1000),
						createdAt: new Date(),
						cancelAtPeriodEnd: subscription.cancel_at_period_end,
					});
				}
				break;
			}

			case 'customer.subscription.updated': {
				const subscription = event.data.object as Stripe.Subscription;

				// Find the subscription in Firestore
				const subscriptionsRef = db.collection('subscriptions');
				const snapshot = await subscriptionsRef
					.where('stripeSubscriptionId', '==', subscription.id)
					.get();

				if (!snapshot.empty) {
					const subscriptionDoc = snapshot.docs[0];
					// Update the subscription
					await subscriptionDoc.ref.update({
						status: subscription.status,
						currentPeriodEnd: new Date(subscription.current_period_end * 1000),
						cancelAtPeriodEnd: subscription.cancel_at_period_end,
					});
				}
				break;
			}

			case 'customer.subscription.deleted': {
				const subscription = event.data.object as Stripe.Subscription;

				// Find the subscription in Firestore
				const subscriptionsRef = db.collection('subscriptions');
				const snapshot = await subscriptionsRef
					.where('stripeSubscriptionId', '==', subscription.id)
					.get();

				if (!snapshot.empty) {
					const subscriptionDoc = snapshot.docs[0];
					// Update the subscription status
					await subscriptionDoc.ref.update({
						status: 'canceled',
						currentPeriodEnd: new Date(subscription.current_period_end * 1000),
					});
				}
				break;
			}
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		console.error('Webhook error:', error);
		return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 });
	}
}

// Disable body parsing, we need the raw body for webhook verification
export const config = {
	api: {
		bodyParser: false,
	},
};
```

### 4. Customer Portal

```typescript
// app/api/billing/portal/route.ts
import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { withAuth } from '@/lib/server/auth-middleware';
import { getUserData } from '@/lib/server/firebase-admin';

export const POST = withAuth(async (req, { uid }) => {
	try {
		const userData = await getUserData(uid);
		const customerId = userData?.stripeCustomerId;

		if (!customerId) {
			return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 });
		}

		// Create a billing portal session
		const session = await stripe.billingPortal.sessions.create({
			customer: customerId,
			return_url: `${process.env.NEXTAUTH_URL}/billing`,
		});

		return NextResponse.json({ url: session.url });
	} catch (error) {
		console.error('Error creating billing portal session:', error);
		return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
	}
});
```

## Usage-Based Billing

For metered pricing based on API usage:

### 1. Create Usage Records

```typescript
async function reportUsage(subscriptionItemId: string, quantity: number) {
	await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
		quantity,
		timestamp: Math.floor(Date.now() / 1000),
		action: 'increment',
	});
}
```

### 2. Track Usage in Your Application

```typescript
async function logApiUsage(userId: string, service: string, usage: number) {
	const db = getFirestoreDb();

	// Get the user's subscription
	const subscriptionsRef = db.collection('subscriptions');
	const snapshot = await subscriptionsRef
		.where('userId', '==', userId)
		.where('status', '==', 'active')
		.get();

	if (!snapshot.empty) {
		const subscription = snapshot.docs[0].data();
		const stripeSubscription = await stripe.subscriptions.retrieve(
			subscription.stripeSubscriptionId
		);
		const subscriptionItem = stripeSubscription.items.data.find(
			item => item.price.metadata.service === service
		);

		if (subscriptionItem) {
			// Report usage to Stripe
			await reportUsage(subscriptionItem.id, usage);
		}
	}

	// Log usage in your database
	await db.collection('usage_logs').add({
		userId,
		service,
		usage,
		timestamp: new Date(),
	});
}
```

## Security Considerations

1. **Never expose your Stripe secret key** in client-side code
2. **Always verify webhook signatures** to prevent fraudulent requests
3. **Use HTTPS** for all communications with Stripe
4. **Implement proper error handling** for all Stripe operations
5. **Store sensitive information securely** (e.g., customer IDs, subscription IDs)
6. **Use server-side authentication** for all payment-related operations

## Testing

### Test Cards

Use these test card numbers for development:

- `4242 4242 4242 4242` - Successful payment
- `4000 0000 0000 0341` - Failed payment
- `4000 0000 0000 9995` - Insufficient funds

### Testing Webhooks

Use Stripe CLI to test webhooks locally:

```bash
stripe listen --forward-to http://localhost:3000/api/billing/webhook
```

## Going Live

Before going live, complete these steps:

1. Switch to live API keys
2. Set up live webhooks
3. Configure your domain with proper SSL
4. Test the complete payment flow in a staging environment
5. Set up monitoring and alerts for payment failures
6. Implement proper error handling and recovery mechanisms
