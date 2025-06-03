/**
 * System configuration API endpoint
 * Allows admins to view and update system-wide settings
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '../../../../lib/firebase';
import { withAdmin } from '../../../../lib/server/auth-middleware';

interface SystemConfig {
	maintenance: {
		enabled: boolean;
		message: string;
		scheduledEnd?: string;
	};
	features: {
		newUserRegistration: boolean;
		selfServiceBilling: boolean;
		apiKeyGeneration: boolean;
		usageReporting: boolean;
	};
	limits: {
		maxUsersPerOrg: number;
		maxApiKeysPerUser: number;
		defaultQuota: {
			apiCalls: number;
			computeMinutes: number;
			storageGB: number;
		};
	};
	integrations: {
		stripe: {
			enabled: boolean;
			webhookConfigured: boolean;
		};
		firebase: {
			enabled: boolean;
			authConfigured: boolean;
		};
	};
}

async function handleGetConfig(req: NextRequest, context: { uid: string }) {
	try {
		const admin = getAdminApp();
		const db = (admin as any).firestore();

		// Get system configuration from Firestore
		const configDoc = await db.collection('system').doc('config').get();
		const config = configDoc.exists ? configDoc.data() : getDefaultConfig();

		return NextResponse.json({ config });

	} catch (error) {
		console.error('Get config error:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch system configuration' },
			{ status: 500 }
		);
	}
}

async function handleUpdateConfig(req: NextRequest, context: { uid: string }) {
	try {
		const admin = getAdminApp();
		const db = (admin as any).firestore();

		const updates = await req.json();

		// Validate the updates (basic validation)
		if (!isValidConfigUpdate(updates)) {
			return NextResponse.json(
				{ error: 'Invalid configuration data' },
				{ status: 400 }
			);
		}

		// Update the system configuration
		await db.collection('system').doc('config').set(updates, { merge: true });

		// Log the configuration change
		await db.collection('system').doc('audit').collection('changes').add({
			type: 'config_update',
			adminUid: context.uid,
			changes: updates,
			timestamp: new Date().toISOString()
		});

		return NextResponse.json({
			success: true,
			message: 'Configuration updated successfully'
		});

	} catch (error) {
		console.error('Update config error:', error);
		return NextResponse.json(
			{ error: 'Failed to update system configuration' },
			{ status: 500 }
		);
	}
}

function getDefaultConfig(): SystemConfig {
	return {
		maintenance: {
			enabled: false,
			message: 'System maintenance in progress. Please try again later.'
		},
		features: {
			newUserRegistration: true,
			selfServiceBilling: true,
			apiKeyGeneration: true,
			usageReporting: true
		},
		limits: {
			maxUsersPerOrg: 100,
			maxApiKeysPerUser: 10,
			defaultQuota: {
				apiCalls: 10000,
				computeMinutes: 60,
				storageGB: 5
			}
		},
		integrations: {
			stripe: {
				enabled: !!process.env.STRIPE_SECRET_KEY,
				webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET
			},
			firebase: {
				enabled: !!process.env.FIREBASE_ADMIN_CREDENTIALS,
				authConfigured: true
			}
		}
	};
}

function isValidConfigUpdate(updates: any): boolean {
	// Basic validation - in production, use a schema validator like Joi or Zod
	if (!updates || typeof updates !== 'object') {
		return false;
	}

	// Check for required structure and types
	if (updates.maintenance && typeof updates.maintenance.enabled !== 'boolean') {
		return false;
	}

	if (updates.features) {
		const features = updates.features;
		if (typeof features.newUserRegistration !== 'undefined' && typeof features.newUserRegistration !== 'boolean') {
			return false;
		}
	}

	if (updates.limits?.defaultQuota) {
		const quota = updates.limits.defaultQuota;
		if (quota.apiCalls && (typeof quota.apiCalls !== 'number' || quota.apiCalls < 0)) {
			return false;
		}
	}

	return true;
}

export const GET = withAdmin(handleGetConfig);
export const PUT = withAdmin(handleUpdateConfig);
