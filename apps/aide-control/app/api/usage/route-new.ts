/**
 * API route for tracking service usage
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../lib/server/auth-middleware';
import { updateUsage } from '../../../lib/server/quota-middleware';
import { getAdminApp } from '../../../lib/firebase';

interface UsageRequestData {
	serviceType: string;
	providerId?: string;
	amount?: number;
	requestDetails: {
		inputTokens?: number;
		outputTokens?: number;
		duration?: number;
		operation?: string;
		[key: string]: any;
	};
}

interface UsageRecord {
	userId: string;
	serviceType: string;
	providerId: string;
	timestamp: Date;
	requestDetails: any;
	estimatedCost?: number;
}

/**
 * POST /api/usage - Log usage of a service (with quota checking)
 */
export function POST(req: NextRequest) {
	return withAuth(async (req, { uid }) => {
		try {
			const usageData: UsageRequestData = await req.json();
			const { serviceType, providerId = 'internal', requestDetails, amount = 1 } = usageData;

			if (!serviceType || !requestDetails) {
				return NextResponse.json(
					{ error: 'Missing required fields: serviceType, requestDetails' },
					{ status: 400 }
				);
			}

			// Map service types to quota types
			let quotaType: 'api' | 'compute' | 'storage' | 'deployment' = 'api';
			switch (serviceType) {
				case 'openai':
				case 'azure_openai':
				case 'anthropic':
					quotaType = 'api';
					break;
				case 'compute':
				case 'execution':
					quotaType = 'compute';
					break;
				case 'storage':
					quotaType = 'storage';
					break;
				case 'deployment':
					quotaType = 'deployment';
					break;
				default:
					quotaType = 'api';
			}

			// Update usage (this will check quota first)
			await updateUsage(uid, quotaType, amount);

			// Create the usage record for detailed tracking
			const usageRecord: UsageRecord = {
				userId: uid,
				serviceType,
				providerId,
				timestamp: new Date(),
				requestDetails,
			};

			// Calculate cost if we have token counts
			if (requestDetails.inputTokens || requestDetails.outputTokens) {
				// Get pricing information from service config
				const admin = getAdminApp();
				const serviceDoc = await admin.firestore()
					.collection('services')
					.where('providerId', '==', providerId)
					.where('serviceType', '==', serviceType)
					.limit(1)
					.get();

				if (!serviceDoc.empty) {
					const serviceData = serviceDoc.docs[0].data();
					const pricing = serviceData.pricing || {};

					// Calculate cost based on tokens
					const inputCost = (requestDetails.inputTokens || 0) * (pricing.inputTokenPrice || 0);
					const outputCost = (requestDetails.outputTokens || 0) * (pricing.outputTokenPrice || 0);

					usageRecord.estimatedCost = inputCost + outputCost;
				}
			}

			// Store detailed usage record
			const admin = getAdminApp();
			await admin.firestore()
				.collection('users')
				.doc(uid)
				.collection('usage_log')
				.add(usageRecord);

			return NextResponse.json({
				success: true,
				message: 'Usage logged successfully',
				usageId: usageRecord.timestamp.getTime().toString()
			});

		} catch (error: any) {
			console.error('Error logging usage:', error);

			// Check if it's a quota error
			if (error.message?.includes('Quota exceeded')) {
				return NextResponse.json(
					{
						error: 'Quota exceeded',
						details: error.message
					},
					{ status: 429 }
				);
			}

			return NextResponse.json(
				{ error: 'Failed to log usage' },
				{ status: 500 }
			);
		}
	})(req);
}

/**
 * GET /api/usage - Get usage statistics for the current user
 */
export function GET(req: NextRequest) {
	return withAuth(async (req, { uid }) => {
		try {
			const admin = getAdminApp();
			const url = new URL(req.url);
			const period = url.searchParams.get('period') || 'current';
			const limit = parseInt(url.searchParams.get('limit') || '100');

			let usageQuery;

			if (period === 'current') {
				// Get current month's usage summary
				const usageDoc = await admin.firestore()
					.collection('users')
					.doc(uid)
					.collection('usage')
					.doc('current')
					.get();

				const currentUsage = usageDoc.exists ? usageDoc.data() : {
					apiCalls: 0,
					computeMinutes: 0,
					storageMB: 0,
					deployments: 0,
					lastReset: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				};

				return NextResponse.json({
					success: true,
					period: 'current',
					data: currentUsage
				});
			} else {
				// Get usage log entries
				usageQuery = admin.firestore()
					.collection('users')
					.doc(uid)
					.collection('usage_log')
					.orderBy('timestamp', 'desc')
					.limit(limit);

				const usageSnapshot = await usageQuery.get();
				const usageLog = usageSnapshot.docs.map(doc => ({
					id: doc.id,
					...doc.data()
				}));

				return NextResponse.json({
					success: true,
					period: 'log',
					data: usageLog,
					count: usageLog.length
				});
			}

		} catch (error) {
			console.error('Error fetching usage:', error);
			return NextResponse.json(
				{ error: 'Failed to fetch usage data' },
				{ status: 500 }
			);
		}
	})(req);
}
