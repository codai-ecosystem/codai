/**
 * API route for managing specific API keys
 */
// @ts-ignore - Next.js types
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../lib/server/auth-middleware';
import { getAdminApp } from '../../../../lib/firebase-admin';

/**
 * GET /api/api-keys/[id] - Get details of a specific API key
 */
export function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (_, { uid }) => {
    try {
      const { id: keyId } = await params;
      const admin = getAdminApp();
      const db = (admin as any).firestore();

      // Get the API key
      const keyDoc = await db.collection('api_keys').doc(keyId).get();

      if (!keyDoc.exists) {
        return NextResponse.json(
          { error: 'API key not found' },
          { status: 404 }
        );
      }

      const keyData = keyDoc.data();

      // Check if user owns the key or is an admin
      if (keyData?.userId !== uid) {
        // Check if the user is an admin
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
          return NextResponse.json(
            { error: 'Not authorized to access this API key' },
            { status: 403 }
          );
        }
      }

      // Return the API key details (never return the hashed key)
      return NextResponse.json({
        apiKey: {
          id: keyDoc.id,
          name: keyData?.name,
          userId: keyData?.userId,
          prefix: keyData?.prefix,
          lastUsed: keyData?.lastUsed,
          createdAt: keyData?.createdAt.toDate(),
          expiresAt: keyData?.expiresAt?.toDate()
        }
      });
    } catch (error) {
      console.error('Error getting API key:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve API key' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * DELETE /api/api-keys/[id] - Delete a specific API key
 */
export function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (_, { uid }) => {
    try {
      const { id: keyId } = await params;
      const admin = getAdminApp();
      const db = (admin as any).firestore();

      // Get the API key
      const keyDoc = await db.collection('api_keys').doc(keyId).get();

      if (!keyDoc.exists) {
        return NextResponse.json(
          { error: 'API key not found' },
          { status: 404 }
        );
      }

      const keyData = keyDoc.data();

      // Check if user owns the key or is an admin
      if (keyData?.userId !== uid) {
        // Check if the user is an admin
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
          return NextResponse.json(
            { error: 'Not authorized to delete this API key' },
            { status: 403 }
          );
        }
      }

      // Delete the API key
      await db.collection('api_keys').doc(keyId).delete();

      return NextResponse.json({
        message: 'API key deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting API key:', error);
      return NextResponse.json(
        { error: 'Failed to delete API key' },
        { status: 500 }
      );
    }
  })(req);
}
