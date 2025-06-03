/**
 * Services Configuration API
 * Manages AI service configurations for users (LLM, Embedding services)
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../lib/auth-middleware';
import { adminDb, COLLECTIONS } from '../../../lib/firebase-admin';
import { ServiceConfig, ServiceType } from '../../../lib/types';
import { serviceManager } from '../../../lib/services/service-manager';

interface ServiceListParams {
	serviceType?: ServiceType;
	userId?: string;
}

/**
 * GET /api/services
 * List all service configurations for the authenticated user
 */
async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const serviceType = searchParams.get('serviceType') as ServiceType | null;

		// Get user from auth middleware
		const user = (request as any).user;
		const userId = user.uid;

		// Get user's service configurations
		const serviceConfigs = await serviceManager.getUserServiceConfigs(userId);

		// Filter by service type if specified
		if (serviceType) {
			return NextResponse.json({
				serviceType,
				configs: serviceConfigs[serviceType] || []
			});
		}

		// Return all configurations
		return NextResponse.json({
			serviceConfigs,
			availableProviders: {
				llm: serviceManager.getAvailableProviders('llm'),
				embedding: serviceManager.getAvailableProviders('embedding')
			}
		});
	} catch (error) {
		console.error('Error fetching service configurations:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch service configurations' },
			{ status: 500 }
		);
	}
}

/**
 * POST /api/services
 * Add or update a service configuration for the authenticated user
 */
async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { serviceType, config } = body;

		// Validate input
		if (!serviceType || !config) {
			return NextResponse.json(
				{ error: 'Service type and configuration are required' },
				{ status: 400 }
			);
		}

		if (!['llm', 'embedding'].includes(serviceType)) {
			return NextResponse.json(
				{ error: 'Invalid service type. Must be "llm" or "embedding"' },
				{ status: 400 }
			);
		}

		// Validate service configuration
		const requiredFields = ['providerId', 'isManaged'];
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

		// Get user from auth middleware
		const user = (request as any).user;
		const userId = user.uid;

		// Check if provider is supported
		const availableProviders = serviceManager.getAvailableProviders(serviceType);
		if (!availableProviders.includes(config.providerId)) {
			return NextResponse.json(
				{ error: `Unsupported provider: ${config.providerId}. Available: ${availableProviders.join(', ')}` },
				{ status: 400 }
			);
		}

		// Add user metadata to config
		const serviceConfig: ServiceConfig = {
			...config,
			createdAt: new Date(),
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
				providerId: config.providerId,
				isManaged: config.isManaged
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
			providerId: config.providerId
		});
	} catch (error) {
		console.error('Error updating service configuration:', error);
		return NextResponse.json(
			{ error: 'Failed to update service configuration' },
			{ status: 500 }
		);
	}
}

// Apply auth middleware to route handlers
const authenticatedGET = withAuth(GET);
const authenticatedPOST = withAuth(POST);

export { authenticatedGET as GET, authenticatedPOST as POST };
