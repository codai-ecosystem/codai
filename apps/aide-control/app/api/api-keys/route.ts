import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '../../../lib/firebase';
import { withAuth } from '../../../lib/server/auth-middleware';

// Get Firestore instance from our centralized Firebase admin initialization
const admin = getAdminApp();
const db = admin.firestore();

// Helper function to verify Firebase ID token
async function verifyAuthToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    return decodedToken;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

// Helper function to check if user is admin
async function isUserAdmin(uid: string) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    return userData?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  // Verify authentication
  const decodedToken = await verifyAuthToken(request);

  if (!decodedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get API keys for the authenticated user
    const apiKeysSnapshot = await db
      .collection('api_keys')
      .where('userId', '==', decodedToken.uid)
      .get();

    const apiKeys = apiKeysSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ apiKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Verify authentication
  const decodedToken = await verifyAuthToken(request);

  if (!decodedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { serviceType, providerId, apiKey, mode, name } = await request.json();

    // Validate required fields
    if (!serviceType || !providerId || !mode || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If in self-managed mode, API key is required
    if (mode === 'self-managed' && !apiKey) {
      return NextResponse.json({ error: 'API key is required for self-managed mode' }, { status: 400 });
    }

    // Verify API key if self-managed mode
    if (mode === 'self-managed') {
      // Here you would add code to verify the API key with the provider
      // For now, we'll skip verification in this example
    }

    // Create API key record
    const newApiKey = {
      userId: decodedToken.uid,
      serviceType,
      providerId,
      mode,
      name,
      apiKey: mode === 'self-managed' ? apiKey : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection('api_keys').add(newApiKey);

    return NextResponse.json({
      id: docRef.id,
      ...newApiKey
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Verify authentication
  const decodedToken = await verifyAuthToken(request);

  if (!decodedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, serviceType, providerId, apiKey, mode, name } = await request.json();

    // Validate required fields
    if (!id) {
      return NextResponse.json({ error: 'Missing API key id' }, { status: 400 });
    }

    // Get the existing API key
    const apiKeyDoc = await db.collection('api_keys').doc(id).get();

    if (!apiKeyDoc.exists) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    const existingApiKey = apiKeyDoc.data();

    // Check if user owns the API key or is an admin
    if (existingApiKey?.userId !== decodedToken.uid) {
      const isAdmin = await isUserAdmin(decodedToken.uid);

      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Update API key
    const updatedApiKey = {
      serviceType: serviceType || existingApiKey?.serviceType,
      providerId: providerId || existingApiKey?.providerId,
      mode: mode || existingApiKey?.mode,
      name: name || existingApiKey?.name,
      updatedAt: new Date().toISOString(),
    };

    // Only update API key if specified and in self-managed mode
    if (apiKey && (mode === 'self-managed' || existingApiKey?.mode === 'self-managed')) {
      updatedApiKey['apiKey'] = apiKey;
    }

    await db.collection('api_keys').doc(id).update(updatedApiKey);

    return NextResponse.json({
      id,
      userId: existingApiKey?.userId,
      ...updatedApiKey
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Verify authentication
  const decodedToken = await verifyAuthToken(request);

  if (!decodedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await request.json();

    // Validate required fields
    if (!id) {
      return NextResponse.json({ error: 'Missing API key id' }, { status: 400 });
    }

    // Get the existing API key
    const apiKeyDoc = await db.collection('api_keys').doc(id).get();

    if (!apiKeyDoc.exists) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    const existingApiKey = apiKeyDoc.data();

    // Check if user owns the API key or is an admin
    if (existingApiKey?.userId !== decodedToken.uid) {
      const isAdmin = await isUserAdmin(decodedToken.uid);

      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Delete API key
    await db.collection('api_keys').doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
