/**
 * Dashboard statistics API endpoint
 * Provides real-time metrics for the admin dashboard
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '../../../../lib/firebase';
import { withAdmin } from '../../../../lib/server/auth-middleware';

async function handleGetDashboardStats(req: NextRequest, context: { uid: string }) {
	try {
		const admin = getAdminApp();
		const db = (admin as any).firestore();

		// Fetch dashboard statistics
		const stats = await fetchDashboardStats(db);
		const recentActivity = await fetchRecentActivity(db);

		return NextResponse.json({
			stats,
			recentActivity
		});

	} catch (error) {
		console.error('Dashboard stats error:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch dashboard statistics' },
			{ status: 500 }
		);
	}
}

export const GET = withAdmin(handleGetDashboardStats);

async function fetchDashboardStats(db: any) {
	try {
		// Get total users count
		const usersSnapshot = await db.collection('users').count().get();
		const totalUsers = usersSnapshot.data().count;

		// Get active subscriptions count
		const activeSubsSnapshot = await db
			.collection('users')
			.where('subscriptionStatus', 'in', ['active', 'trialing'])
			.count()
			.get();
		const activeSubscriptions = activeSubsSnapshot.data().count;

		// Calculate monthly revenue (last 30 days)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const paymentsSnapshot = await db
			.collection('payments')
			.where('createdAt', '>=', thirtyDaysAgo.toISOString())
			.where('status', '==', 'succeeded')
			.get();

		const monthlyRevenue = paymentsSnapshot.docs.reduce((total, doc) => {
			const payment = doc.data();
			return total + (payment.amount || 0);
		}, 0) / 100; // Convert from cents to dollars

		// Get today's API calls
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayStart = today.toISOString();

		const usageSnapshot = await db
			.collectionGroup('usage')
			.where('date', '>=', todayStart)
			.get();

		const apiCallsToday = usageSnapshot.docs.reduce((total, doc) => {
			const usage = doc.data();
			return total + (usage.apiCalls || 0);
		}, 0);

		// Determine system status (simplified check)
		const systemStatus = await determineSystemStatus(db);

		return {
			totalUsers,
			activeSubscriptions,
			monthlyRevenue,
			apiCallsToday,
			systemStatus
		};
	} catch (error) {
		console.error('Error fetching dashboard stats:', error);
		// Return mock data if there's an error
		return {
			totalUsers: 0,
			activeSubscriptions: 0,
			monthlyRevenue: 0,
			apiCallsToday: 0,
			systemStatus: 'operational' as const
		};
	}
}

async function fetchRecentActivity(db: any) {
	try {
		const activities: any[] = [];

		// Get recent user signups (last 24 hours)
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);

		const recentUsersSnapshot = await db
			.collection('users')
			.where('createdAt', '>=', yesterday.toISOString())
			.orderBy('createdAt', 'desc')
			.limit(5)
			.get();

		recentUsersSnapshot.docs.forEach(doc => {
			const user = doc.data();
			activities.push({
				id: `user_${doc.id}`,
				type: 'user_signup',
				message: `New user registered: ${user.email || 'Unknown'}`,
				timestamp: user.createdAt,
				userId: doc.id
			});
		});

		// Get recent subscription events
		const recentBillingSnapshot = await db
			.collection('billing')
			.where('createdAt', '>=', yesterday.toISOString())
			.orderBy('createdAt', 'desc')
			.limit(5)
			.get();

		recentBillingSnapshot.docs.forEach(doc => {
			const billing = doc.data();
			if (billing.status === 'active') {
				activities.push({
					id: `billing_${doc.id}`,
					type: 'subscription_created',
					message: `New subscription activated for user ${doc.id}`,
					timestamp: billing.createdAt,
					userId: doc.id
				});
			}
		});

		// Get recent payments
		const recentPaymentsSnapshot = await db
			.collection('payments')
			.where('createdAt', '>=', yesterday.toISOString())
			.where('status', '==', 'succeeded')
			.orderBy('createdAt', 'desc')
			.limit(3)
			.get();

		recentPaymentsSnapshot.docs.forEach(doc => {
			const payment = doc.data();
			const amount = (payment.amount || 0) / 100; // Convert from cents
			activities.push({
				id: `payment_${doc.id}`,
				type: 'payment_succeeded',
				message: `Payment of $${amount.toFixed(2)} processed successfully`,
				timestamp: payment.createdAt,
				userId: payment.userId
			});
		});

		// Sort by timestamp and limit to 10 most recent
		return activities
			.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
			.slice(0, 10);

	} catch (error) {
		console.error('Error fetching recent activity:', error);
		return [];
	}
}

async function determineSystemStatus(db: any): Promise<'operational' | 'degraded' | 'down'> {
	try {
		// Simple health check - could be expanded to check various system components
		// For now, just check if we can read from the database
		await db.collection('users').limit(1).get();
		return 'operational';
	} catch (error) {
		console.error('System health check failed:', error);
		return 'down';
	}
}
