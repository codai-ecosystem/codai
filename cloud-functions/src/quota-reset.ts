/**
 * Cloud Function to reset monthly quotas
 * This function should be deployed to Google Cloud Functions
 * and scheduled to run monthly using Cloud Scheduler
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
initializeApp();

/**
 * Scheduled function to reset monthly quotas
 * Runs on the 1st of each month at 00:00 UTC
 */
export const resetMonthlyQuotas = onSchedule({
	schedule: '0 0 1 * *', // Cron expression for 1st of each month at midnight UTC
	timeZone: 'UTC',
	memory: '256MiB',
	timeoutSeconds: 300,
}, async (event) => {
	const db = getFirestore();

	try {
		console.log('Starting monthly quota reset...');

		// Get all users
		const usersSnapshot = await db.collection('users').get();
		const batchSize = 500; // Firestore batch limit
		let processedCount = 0;

		// Process users in batches
		for (let i = 0; i < usersSnapshot.docs.length; i += batchSize) {
			const batch = db.batch();
			const batchDocs = usersSnapshot.docs.slice(i, i + batchSize);

			for (const userDoc of batchDocs) {
				const usageRef = userDoc.ref.collection('usage').doc('current');

				batch.set(usageRef, {
					apiCalls: 0,
					computeMinutes: 0,
					storageMB: 0,
					lastReset: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				}, { merge: true });

				processedCount++;
			}

			await batch.commit();
			console.log(`Processed batch ${Math.floor(i / batchSize) + 1}, total users: ${processedCount}`);
		}

		// Log the reset event
		await db.collection('system_events').add({
			type: 'quota_reset',
			usersAffected: processedCount,
			timestamp: new Date().toISOString(),
			success: true,
		});

		console.log(`Successfully reset quotas for ${processedCount} users`);

	} catch (error) {
		console.error('Error resetting monthly quotas:', error);

		// Log the error
		await db.collection('system_events').add({
			type: 'quota_reset',
			error: error.message,
			timestamp: new Date().toISOString(),
			success: false,
		});

		throw error;
	}
});
