/**
 * Server-side Firebase Admin utilities
 */
import * as admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Singleton pattern to get Firebase Admin app
export function getAdminApp() {
  if (getApps().length === 0) {
    try {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (serviceAccountKey) {
        const serviceAccount = JSON.parse(serviceAccountKey);
        initializeApp({
          credential: cert(serviceAccount),
          databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`,
          storageBucket: `${serviceAccount.project_id}.appspot.com`
        });
      } else {
        // Fallback for development
        initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
        });
      }
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
    }
  }
  return admin;
}

/**
 * Verify a Firebase ID token
 * @param token - The token to verify
 * @returns The decoded token if valid
 */
export async function verifyIdToken(token: string) {
  try {
    getAdminApp(); // Ensure app is initialized
    return await getAuth().verifyIdToken(token);
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Unauthorized');
  }
}

/**
 * Check if a user has admin privileges
 * @param uid - The user ID to check
 * @returns Boolean indicating if the user is an admin
 */
export async function isUserAdmin(uid: string): Promise<boolean> {
  try {
    getAdminApp(); // Ensure app is initialized
    const db = getFirestore();
    const user = await db.collection('users').doc(uid).get();
    const userData = user.data();
    return userData?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get user data from Firestore
 * @param uid - The user ID
 * @returns The user data
 */
export async function getUserData(uid: string) {
  try {
    getAdminApp(); // Ensure app is initialized
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(uid).get();
    return userDoc.exists ? userDoc.data() : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
}

/**
 * Create or update user data in Firestore
 * @param uid - The user ID
 * @param data - The user data to store
 */
export async function setUserData(uid: string, data: any) {
  try {
    getAdminApp(); // Ensure app is initialized
    const db = getFirestore();
    await db.collection('users').doc(uid).set(data, { merge: true });
  } catch (error) {
    console.error('Error setting user data:', error);
    throw error;
  }
}
