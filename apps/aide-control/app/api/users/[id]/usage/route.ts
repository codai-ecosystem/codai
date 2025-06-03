/**
 * API route for retrieving user usage data
 */
// @ts-ignore - Next.js types
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../../lib/server/auth-middleware';
import { getAdminApp } from '../../../../../lib/firebase';

/**
 * GET /api/users/[uid]/usage - Get usage records for a specific user
 */
export function GET(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  return withAuth(async (req, { uid: currentUid }) => {
    try {
      const userUid = params.uid;
      
      // Only allow users to access their own data unless they're an admin
      const admin = getAdminApp();
      
      if (currentUid !== userUid) {
        // Check if requesting user is an admin
        const adminUserData = await admin.firestore().collection('users').doc(currentUid).get();
        if (!adminUserData.exists || adminUserData.data()?.role !== 'admin') {
          return NextResponse.json(
            { error: 'Not authorized to access this resource' }, 
            { status: 403 }
          );
        }
      }
      
      // Parse query parameters
      const url = new URL(req.url);
      const startDate = url.searchParams.get('start') ? new Date(url.searchParams.get('start')!) : null;
      const endDate = url.searchParams.get('end') ? new Date(url.searchParams.get('end')!) : null;
      
      // Build the query
      let usageQuery = admin.firestore().collection('usage')
        .where('userId', '==', userUid)
        .orderBy('timestamp', 'desc')
        .limit(100); // Default limit
      
      // Add date filters if provided
      if (startDate) {
        usageQuery = usageQuery.where('timestamp', '>=', startDate);
      }
      
      if (endDate) {
        usageQuery = usageQuery.where('timestamp', '<=', endDate);
      }
      
      // Get usage records
      const usageSnapshot = await usageQuery.get();
      
      const usage = usageSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate().toISOString()
      }));
      
      // Get user's usage limits
      const userData = await admin.firestore().collection('users').doc(userUid).get();
      const { usageCurrent = 0, usageLimit = 0 } = userData.data() || {};
      
      return NextResponse.json({ 
        usage,
        summary: {
          total: usageCurrent,
          limit: usageLimit,
          remaining: Math.max(0, usageLimit - usageCurrent)
        }
      });
    } catch (error) {
      console.error('Error getting usage data:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve usage data' }, 
        { status: 500 }
      );
    }
  })(req);
}
