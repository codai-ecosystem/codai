/**
 * Billing API
 * Manages Stripe billing, plans, and subscriptions
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdminAuth } from '../../../lib/auth-middleware';
import { adminDb, COLLECTIONS } from '../../../lib/firebase-admin';
import { BillingService } from '../../../lib/services/billing-service';

const billingService = BillingService.getInstance();

/**
 * GET /api/billing
 * Get billing information for the authenticated user
 */
async function getUserBilling(request: NextRequest) {
	try {
		// Get user from auth middleware
		const user = (request as any).user;
		const userId = user.uid;

		// Get user's billing information
		const billingInfo = await billingService.getUserBilling(userId);

		return NextResponse.json(billingInfo);
	} catch (error) {
		console.error('Error fetching user billing:', error);
		return NextResponse.json({ error: 'Failed to fetch billing information' }, { status: 500 });
	}
}

/**
 * POST /api/billing
 * Create checkout session or manage billing operations
 */
async function manageBilling(request: NextRequest) {
	try {
		const body = await request.json();
		const { action, ...params } = body;

		// Get user from auth middleware
		const user = (request as any).user;
		const userId = user.uid;

		switch (action) {
			case 'create_checkout_session': {
				const { planId, successUrl, cancelUrl } = params;

				if (!planId || !successUrl || !cancelUrl) {
					return NextResponse.json(
						{ error: 'Plan ID, success URL, and cancel URL are required' },
						{ status: 400 }
					);
				}

				// Get or create Stripe customer
				let customerId = user.customerId;
				if (!customerId) {
					customerId = await billingService.createCustomer(user.email, user.displayName);

					// Update user document with customer ID
					await adminDb.collection(COLLECTIONS.USERS).doc(userId).update({
						customerId,
						updatedAt: new Date(),
					});
				}

				// Create checkout session
				const checkoutUrl = await billingService.createCheckoutSession(
					customerId,
					planId,
					successUrl,
					cancelUrl
				);

				// Log audit event
				await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
					userId,
					action: 'checkout_session_created',
					details: { planId, customerId },
					timestamp: new Date(),
					metadata: {
						userAgent: request.headers.get('user-agent'),
						ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
					},
				});

				return NextResponse.json({ checkoutUrl });
			}

			case 'cancel_subscription': {
				const { subscriptionId } = params;

				if (!subscriptionId) {
					return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
				}

				await billingService.cancelSubscription(subscriptionId);

				// Log audit event
				await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
					userId,
					action: 'subscription_cancelled',
					details: { subscriptionId },
					timestamp: new Date(),
					metadata: {
						userAgent: request.headers.get('user-agent'),
						ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
					},
				});

				return NextResponse.json({
					message: 'Subscription cancelled successfully',
				});
			}

			default:
				return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
		}
	} catch (error) {
		console.error('Error managing billing:', error);
		return NextResponse.json({ error: 'Failed to process billing request' }, { status: 500 });
	}
}

// Export handlers
export const GET = withAuth(getUserBilling);
export const POST = withAuth(manageBilling);
