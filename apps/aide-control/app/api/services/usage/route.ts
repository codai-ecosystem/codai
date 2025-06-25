/**
 * API route for recording service usage
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../lib/server/auth-middleware';
import { serviceManager } from '../../../../lib/services/service-manager';
import { ServiceType } from '../../../../lib/types';

/**
 * POST /api/services/usage - Record service usage
 */
export function POST(req: NextRequest) {
	return withAuth(async (req, { uid }) => {
		try {
			const { serviceType, providerId, requestDetails, cost } = await req.json();

			if (!serviceType || !providerId || !requestDetails) {
				return NextResponse.json(
					{ error: 'Service type, provider ID, and request details are required' },
					{ status: 400 }
				);
			}

			// Validate service type
			if (!['llm', 'embedding'].includes(serviceType)) {
				return NextResponse.json(
					{ error: 'Invalid service type. Must be "llm" or "embedding"' },
					{ status: 400 }
				);
			}

			// Record usage
			await serviceManager.recordUsage(uid, {
				serviceType: serviceType as ServiceType,
				providerId,
				requestDetails,
				cost: cost || 0,
				timestamp: new Date(),
			});

			return NextResponse.json({
				message: 'Usage recorded successfully',
				serviceType,
				providerId,
				endpoint: requestDetails.endpoint,
			});
		} catch (error) {
			console.error('Error recording usage:', error);
			return NextResponse.json({ error: 'Failed to record usage' }, { status: 500 });
		}
	})(req);
}
