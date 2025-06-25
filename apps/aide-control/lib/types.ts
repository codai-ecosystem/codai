/**
 * This file defines the interfaces for the dual-mode infrastructure system
 * It allows users to choose between managed services (hosted by the platform)
 * or self-managed services (bring your own API keys)
 */

export interface ServiceConfig {
	id?: string; // Optional ID for database records
	userId?: string; // User who owns this configuration
	mode: 'managed' | 'self-managed';
	providerId: string; // e.g., 'openai', 'azure', 'anthropic'
	serviceType: ServiceType;
	model?: string; // The specific model being used
	apiKey?: string;
	baseUrl?: string;
	additionalConfig?: Record<string, any>;
	isActive?: boolean; // Whether this configuration is currently active
	createdAt?: Date;
	updatedAt?: Date;
}

export type ServiceType =
	| 'llm'
	| 'embedding'
	| 'storage'
	| 'vector-db'
	| 'authentication'
	| 'analytics';

export interface UsageRecord {
	userId: string;
	serviceType: ServiceType;
	providerId: string;
	timestamp: Date;
	requestDetails: {
		endpoint: string;
		inputTokens?: number;
		outputTokens?: number;
		duration?: number;
		model?: string;
	};
	cost?: number; // Calculated cost in smallest currency unit (e.g., cents)
}

export interface BillingPlan {
	id: string;
	name: string;
	description: string;
	price: number; // in smallest currency unit (e.g., cents)
	interval: 'month' | 'year';
	features: {
		serviceType: ServiceType;
		providerId: string;
		limit?: number;
		costMultiplier?: number;
	}[];
	stripeProductId?: string;
	stripePriceId?: string;
}

export interface UserProfile {
	userId: string;
	email: string;
	displayName?: string;
	role: 'admin' | 'user';
	billingPlanId?: string;
	customerId?: string; // Stripe customer ID
	serviceConfigs: Record<ServiceType, ServiceConfig[]>;
	usageLimit?: number;
	usageCurrent?: number;
	createdAt: Date;
	updatedAt: Date;
}
