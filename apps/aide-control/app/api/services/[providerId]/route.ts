/**
 * Individual Service Configuration API
 * Manages specific AI service configurations by provider ID
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../lib/auth-middleware';
import { adminDb, COLLECTIONS } from '../../../../lib/firebase-admin';
import { ServiceConfig, ServiceType } from '../../../../lib/types';
import { serviceManager } from '../../../../lib/services/service-manager';

interface ServiceParams {
	params: {
		providerId: string;
	};
}

/**
 * GET /api/services/[providerId]
 * Get a specific service configuration for the authenticated user
 */
async function getServiceConfig(request: NextRequest, { params }: ServiceParams) {
	try {
		const { providerId } = params;
		const { searchParams } = new URL(request.url);
		const serviceType = searchParams.get('serviceType') as ServiceType;

		if (!serviceType) {
			return NextResponse.json(
				{ error: 'Service type parameter is required' },
				{ status: 400 }
			);
		}

		// Get user from auth middleware
		const user = (request as any).user;
		const userId = user.uid;

		// Get user's service configurations
		const serviceConfigs = await serviceManager.getUserServiceConfigs(userId);

		// Find the specific configuration
		const config = serviceConfigs[serviceType]?.find(
			(c: ServiceConfig) => c.providerId === providerId
		);

		if (!config) {
			return NextResponse.json(
				{ error: `${serviceType} service configuration for ${providerId} not found` },
				{ status: 404 }
			);
		}

		// Remove sensitive information from response
		const sanitizedConfig = {
			...config,
			apiKey: config.apiKey ? '[REDACTED]' : undefined
		};

		return NextResponse.json({
			serviceType,
			providerId,
			config: sanitizedConfig
		});
	} catch (error) {
		console.error('Error fetching service configuration:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch service configuration' },
			{ status: 500 }
		);
	}
}

/**
 * PUT /api/services/[providerId]
 * Update a specific service configuration for the authenticated user
 */
async function updateServiceConfig(request: NextRequest, { params }: ServiceParams) {
	try {
		const { providerId } = params;
		const body = await request.json();
		const { serviceType, config } = body;

		// Validate input
		if (!serviceType) {
			return NextResponse.json(
				{ error: 'Service type is required' },
				{ status: 400 }
			);
		}

		if (!config) {
			return NextResponse.json(
				{ error: 'Configuration object is required' },
				{ status: 400 }
			);
		}

		if (!['llm', 'embedding'].includes(serviceType)) {
			return NextResponse.json(
				{ error: 'Invalid service type. Must be "llm" or "embedding"' },
				{ status: 400 }
			);
		}

		// Ensure provider ID matches URL parameter
		if (config.providerId && config.providerId !== providerId) {
			return NextResponse.json(
				{ error: 'Provider ID in configuration does not match URL parameter' },
				{ status: 400 }
			);
		}

		// Get user from auth middleware
		const user = (request as any).user;
		const userId = user.uid;

		// Check if provider is supported
		const availableProviders = serviceManager.getAvailableProviders(serviceType);
		if (!availableProviders.includes(providerId)) {
			return NextResponse.json(
				{ error: `Unsupported provider: ${providerId}. Available: ${availableProviders.join(', ')}` },
				{ status: 400 }
			);
		}

		// Validate service configuration
		const requiredFields = ['isManaged'];
		for (const field of requiredFields) {
			if (!(field in config)) {
				return NextResponse.json(
					{ error: `Missing required field: ${field}` },
					{ status: 400 }
				);
			}
		}

		// For self-managed services, ensure API key is provided
		if (!config.isManaged && !config.apiKey) {
			return NextResponse.json(
				{ error: 'API key is required for self-managed services' },
				{ status: 400 }
			);
		}

		// Create updated service configuration
		const serviceConfig: ServiceConfig = {
			...config,
			providerId, // Ensure correct provider ID
			updatedAt: new Date()
		};

		// Update service configuration
		await serviceManager.updateServiceConfig(userId, serviceType, serviceConfig);

		// Log audit event
		await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
			userId,
			action: 'service_config_updated',
			details: {
				serviceType,
				providerId,
				isManaged: config.isManaged,
				updated: true
			},
			timestamp: new Date(),
			metadata: {
				userAgent: request.headers.get('user-agent'),
				ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
			}
		});

		return NextResponse.json({
			message: 'Service configuration updated successfully',
			serviceType,
			providerId
		});
	} catch (error) {
		console.error('Error updating service configuration:', error);
		return NextResponse.json(
			{ error: 'Failed to update service configuration' },
			{ status: 500 }
		);
	}
}

/**
 * DELETE /api/services/[providerId]
 * Remove a specific service configuration for the authenticated user
 */
async function deleteServiceConfig(request: NextRequest, { params }: ServiceParams) {
	try {
		const { providerId } = params;
		const { searchParams } = new URL(request.url);
		const serviceType = searchParams.get('serviceType') as ServiceType;

		if (!serviceType) {
			return NextResponse.json(
				{ error: 'Service type parameter is required' },
				{ status: 400 }
			);
		}

		if (!['llm', 'embedding'].includes(serviceType)) {
			return NextResponse.json(
				{ error: 'Invalid service type. Must be "llm" or "embedding"' },
				{ status: 400 }
			);
		}

		// Get user from auth middleware
		const user = (request as any).user;
		const userId = user.uid;

		// Remove service configuration
		await serviceManager.removeServiceConfig(userId, serviceType, providerId);

		// Log audit event
		await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
			userId,
			action: 'service_config_deleted',
			details: {
				serviceType,
				providerId
			},
			timestamp: new Date(),
			metadata: {
				userAgent: request.headers.get('user-agent'),
				ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
			}
		});

		return NextResponse.json({
			message: 'Service configuration removed successfully',
			serviceType,
			providerId
		});
	} catch (error) {
		console.error('Error removing service configuration:', error);
		return NextResponse.json(
			{ error: 'Failed to remove service configuration' },
			{ status: 500 }
		);
	}
}

// Export individual handlers
export const GET = withAuth(async (request: NextRequest) => {
	// Extract providerId from URL pathname
	const providerId = request.url.split('/services/')[1]?.split('?')[0];
	if (!providerId) {
		return NextResponse.json(
			{ error: 'Provider ID is required' },
			{ status: 400 }
		);
	}

	return getServiceConfig(request, { params: { providerId } });
});

export const PUT = withAuth(async (request: NextRequest) => {
	// Extract providerId from URL pathname
	const providerId = request.url.split('/services/')[1]?.split('?')[0];
	if (!providerId) {
		return NextResponse.json(
			{ error: 'Provider ID is required' },
			{ status: 400 }
		);
	}

	return updateServiceConfig(request, { params: { providerId } });
});

export const DELETE = withAuth(async (request: NextRequest) => {
	// Extract providerId from URL pathname
	const providerId = request.url.split('/services/')[1]?.split('?')[0];
	if (!providerId) {
		return NextResponse.json(
			{ error: 'Provider ID is required' },
			{ status: 400 }
		);
	}

	return deleteServiceConfig(request, { params: { providerId } });
});
