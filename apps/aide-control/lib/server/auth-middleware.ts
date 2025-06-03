/**
 * Authentication middleware for API routes
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, isUserAdmin } from './firebase-admin';

/**
 * Extract the authentication token from the request
 */
function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Middleware to authenticate API requests
 * @param handler - The API route handler
 * @returns A wrapped handler that includes authentication
 */
export function withAuth(handler: (req: NextRequest, context: { uid: string }) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const token = getTokenFromRequest(req);
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
      }

      const decodedToken = await verifyIdToken(token);
      return handler(req, { uid: decodedToken.uid });
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }
  };
}

/**
 * Middleware to check if a user is an admin
 * @param handler - The API route handler
 * @returns A wrapped handler that includes admin check
 */
export function withAdmin(handler: (req: NextRequest, context: { uid: string }) => Promise<NextResponse>) {
  return withAuth(async (req, context) => {
    try {
      const isAdmin = await isUserAdmin(context.uid);
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Forbidden: Admin access required' },
          { status: 403 }
        );
      }
      return handler(req, context);
    } catch (error) {
      console.error('Admin verification error:', error);
      return NextResponse.json(
        { error: 'Server error during admin verification' },
        { status: 500 }
      );
    }
  });
}
