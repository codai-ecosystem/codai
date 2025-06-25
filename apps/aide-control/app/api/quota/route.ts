/**
 * API route for quota management
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../lib/server/auth-middleware';
import { getUserQuotaStatus } from '../../../lib/server/quota-middleware';

/**
 * GET /api/quota - Get current user's quota status
 */
export function GET(req: NextRequest) {
	return withAuth(async (req, { uid }) => {
		try {
			const quotaStatus = await getUserQuotaStatus(uid);

			return NextResponse.json({
				success: true,
				data: quotaStatus,
			});
		} catch (error) {
			console.error('Error fetching quota status:', error);
			return NextResponse.json({ error: 'Failed to fetch quota status' }, { status: 500 });
		}
	})(req);
}
