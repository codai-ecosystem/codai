/**
 * API route for specific billing plan management
 */
// @ts-ignore - Next.js types
import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '../../../../../lib/server/auth-middleware';
import { getFirestoreDb } from '../../../../../lib/server/firebase-utils';

/**
 * GET /api/billing/plans/[id] - Get a specific billing plan
 */
export function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(async () => {
    try {
      const { id: planId } = await params;
      const db = getFirestoreDb();

      const planDoc = await db.collection('billing_plans').doc(planId).get();

      if (!planDoc.exists) {
        return NextResponse.json(
          { error: 'Billing plan not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        plan: {
          id: planDoc.id,
          ...planDoc.data()
        }
      });
    } catch (error) {
      console.error('Error getting billing plan:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve billing plan' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * PUT /api/billing/plans/[id] - Update a specific billing plan
 */
export function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(async () => {
    try {
      const { id: planId } = await params;
      const planData = await req.json();

      const db = getFirestoreDb();

      // Check if plan exists
      const planDoc = await db.collection('billing_plans').doc(planId).get();
      if (!planDoc.exists) {
        return NextResponse.json(
          { error: 'Billing plan not found' },
          { status: 404 }
        );
      }

      // Don't allow changing sensitive fields directly
      delete planData.createdAt;
      planData.updatedAt = new Date();

      await db.collection('billing_plans').doc(planId).update(planData);

      return NextResponse.json({
        message: 'Billing plan updated successfully',
        plan: {
          id: planId,
          ...planData
        }
      });
    } catch (error) {
      console.error('Error updating billing plan:', error);
      return NextResponse.json(
        { error: 'Failed to update billing plan' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * DELETE /api/billing/plans/[id] - Delete a specific billing plan
 */
export function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(async () => {
    try {
      const { id: planId } = await params;
      const db = getFirestoreDb();

      // Check if plan exists
      const planDoc = await db.collection('billing_plans').doc(planId).get();
      if (!planDoc.exists) {
        return NextResponse.json(
          { error: 'Billing plan not found' },
          { status: 404 }
        );
      }      // Check if plan is in use by any users
      const usersWithPlan = await db.collection('users')
        .where('billingPlanId', '==', planId)
        .get();

      if (!usersWithPlan.empty) {
        return NextResponse.json(
          { error: 'Cannot delete billing plan that is in use by users' },
          { status: 400 }
        );
      }

      await db.collection('billing_plans').doc(planId).delete();

      return NextResponse.json({
        message: 'Billing plan deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting billing plan:', error);
      return NextResponse.json(
        { error: 'Failed to delete billing plan' },
        { status: 500 }
      );
    }
  })(req);
}
