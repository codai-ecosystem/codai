/**
 * API route for user service management using ServiceManager
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../lib/server/auth-middleware';
import { serviceManager } from '../../../../lib/services/service-manager';
import { ServiceConfig, ServiceType } from '../../../../lib/types';

/**
 * GET /api/services/user - Get user's service configurations
 */
export function GET(req: NextRequest) {
	return withAuth(async (req, { uid }) => {
		try {
			const serviceConfigs = await serviceManager.getUserServiceConfigs(uid);

			return NextResponse.json({ serviceConfigs });
		} catch (error) {
			console.error('Error getting user service configs:', error);
			return NextResponse.json(
				{ error: 'Failed to retrieve service configurations' },
				{ status: 500 }
			);
		}
	})(req);
}

/**
 * POST /api/services/user - Update user's service configuration
 */
export function POST(req: NextRequest) {
	return withAuth(async (req, { uid }) => {
		try {
			const { serviceType, config }: { serviceType: ServiceType; config: ServiceConfig } = await req.json();

			if (!serviceType || !config || !config.providerId) {
				return NextResponse.json(
					{ error: 'Service type, provider ID, and configuration are required' },
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

			// Update service configuration
			await serviceManager.updateServiceConfig(uid, serviceType, config);

			return NextResponse.json({
				message: 'Service configuration updated successfully',
				serviceType,
				providerId: config.providerId
			});
		} catch (error) {
			console.error('Error updating user service config:', error);
			return NextResponse.json(
				{ error: 'Failed to update service configuration' },
				{ status: 500 }
			);
		}
	})(req);
}

/**
 * DELETE /api/services/user - Remove user's service configuration
 */
export function DELETE(req: NextRequest) {
	return withAuth(async (req, { uid }) => {
		try {
			const { searchParams } = new URL(req.url);
			const serviceType = searchParams.get('serviceType') as ServiceType;
			const providerId = searchParams.get('providerId');

			if (!serviceType || !providerId) {
				return NextResponse.json(
					{ error: 'Service type and provider ID are required' },
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

			// Remove service configuration
			await serviceManager.removeServiceConfig(uid, serviceType, providerId);

			return NextResponse.json({
				message: 'Service configuration removed successfully',
				serviceType,
				providerId
			});
		} catch (error) {
			console.error('Error removing user service config:', error);
			return NextResponse.json(
				{ error: 'Failed to remove service configuration' },
				{ status: 500 }
			);
		}
	})(req);
}
