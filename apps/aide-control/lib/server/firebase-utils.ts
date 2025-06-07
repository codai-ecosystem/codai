/**
 * Firebase Admin utilities for server-side operations
 */
import { getAdminApp } from '../firebase-admin';

/**
 * Get Firestore database instance with proper typing
 */
export function getFirestoreDb() {
	const admin = getAdminApp();
	return admin.firestore();
}

/**
 * Helper function to get admin app instance
 */
export function getFirebaseAdmin() {
	return getAdminApp();
}
