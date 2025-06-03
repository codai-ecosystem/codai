/**
 * Server-side Firebase Admin utilities
 */
import { getAdminApp } from '../firebase';

/**
 * Verify a Firebase ID token
 * @param token - The token to verify
 * @returns The decoded token if valid
 */
export async function verifyIdToken(token: string) {
  try {
    const admin = getAdminApp();
    return await admin.auth().verifyIdToken(token);
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
    const admin = getAdminApp();
    const user = await admin.firestore().collection('users').doc(uid).get();
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
    const admin = getAdminApp();
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
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
    const admin = getAdminApp();
    await admin.firestore().collection('users').doc(uid).set(data, { merge: true });
  } catch (error) {
    console.error('Error setting user data:', error);
    throw error;
  }
}
