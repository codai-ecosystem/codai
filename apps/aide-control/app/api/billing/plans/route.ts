/**
 * Billing Plans API
 * Manages billing plans (admin operations)
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdminAuth } from '../../../../lib/auth-middleware';
import { adminDb, COLLECTIONS } from '../../../../lib/firebase-admin';
import { BillingService } from '../../../../lib/services/billing-service';
import { BillingPlan } from '../../../../lib/types';

const billingService = BillingService.getInstance();

/**
 * GET /api/billing/plans
 * Get all billing plans (public)
 */
async function getPlans(request: NextRequest) {
	try {
		const plans = await billingService.getBillingPlans();
		return NextResponse.json({ plans });
	} catch (error) {
		console.error('Error fetching billing plans:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch billing plans' },
			{ status: 500 }
		);
	}
}

/**
 * POST /api/billing/plans
 * Create a new billing plan (admin only)
 */
async function createPlan(request: NextRequest) {
	try {
		const body = await request.json();
		const { name, description, price, interval, features } = body;

		// Validate required fields
		if (!name || !description || price === undefined || !interval || !features) {
			return NextResponse.json(
				{ error: 'Name, description, price, interval, and features are required' },
				{ status: 400 }
			);
		}

		// Validate price is a positive number
		if (typeof price !== 'number' || price < 0) {
			return NextResponse.json(
				{ error: 'Price must be a positive number' },
				{ status: 400 }
			);
		}

		// Validate interval
		if (!['month', 'year'].includes(interval)) {
			return NextResponse.json(
				{ error: 'Interval must be "month" or "year"' },
				{ status: 400 }
			);
		}

		// Validate features array
		if (!Array.isArray(features) || features.length === 0) {
			return NextResponse.json(
				{ error: 'Features must be a non-empty array' },
				{ status: 400 }
			);
		}

		// Validate each feature
		for (const feature of features) {
			if (!feature.serviceType || !feature.providerId) {
				return NextResponse.json(
					{ error: 'Each feature must have serviceType and providerId' },
					{ status: 400 }
				);
			}

			if (!['llm', 'embedding'].includes(feature.serviceType)) {
				return NextResponse.json(
					{ error: 'Feature serviceType must be "llm" or "embedding"' },
					{ status: 400 }
				);
			}
		}

		// Create the plan
		const planData: Omit<BillingPlan, 'id'> = {
			name,
			description,
			price,
			interval,
			features
		};

		const newPlan = await billingService.createBillingPlan(planData);

		// Get user for audit log
		const user = (request as any).user;

		// Log audit event
		await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
			userId: user.uid,
			action: 'billing_plan_created',
			details: {
				planId: newPlan.id,
				name: newPlan.name,
				price: newPlan.price,
				interval: newPlan.interval
			},
			timestamp: new Date(),
			metadata: {
				userAgent: request.headers.get('user-agent'),
				ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
			}
		});

		return NextResponse.json({
			message: 'Billing plan created successfully',
			plan: newPlan
		}, { status: 201 });
	} catch (error) {
		console.error('Error creating billing plan:', error);
		return NextResponse.json(
			{ error: 'Failed to create billing plan' },
			{ status: 500 }
		);
	}
}

// Export handlers - plans are public to view, admin to create
export const GET = getPlans;
export const POST = withAdminAuth(createPlan);
