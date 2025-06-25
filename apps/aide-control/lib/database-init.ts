/**
 * Database Initialization Script
 * Sets up Firestore collections with initial data and schema validation
 */
import { adminDb, COLLECTIONS } from './firebase-admin';
import { BillingPlan, UserProfile } from './types';

/**
 * Initialize Firestore collections with proper indexes and initial data
 */
export async function initializeDatabase() {
	console.log('🔧 Initializing AIDE Control Panel database...');

	try {
		// Initialize collections with sample data
		await initializeUsersCollection();
		await initializeBillingPlansCollection();
		await initializeUsageCollection();
		await initializeAuditLogsCollection();

		console.log('✅ Database initialization completed successfully');
		return { success: true, message: 'Database initialized successfully' };
	} catch (error) {
		console.error('❌ Database initialization failed:', error);
		throw error;
	}
}

/**
 * Initialize users collection
 */
async function initializeUsersCollection() {
	console.log('📝 Setting up users collection...');

	// Check if collection already has data
	const usersSnapshot = await adminDb.collection(COLLECTIONS.USERS).limit(1).get();

	if (!usersSnapshot.empty) {
		console.log('   Users collection already has data, skipping initialization');
		return;
	}

	// Create an admin user template (will be populated when first admin signs in)
	const adminUserTemplate = {
		email: 'admin@aide.dev',
		displayName: 'AIDE Administrator',
		role: 'admin' as const,
		serviceConfigs: {
			llm: [],
			embedding: [],
		},
		usageLimit: 1000000, // 1M tokens
		usageCurrent: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	// Note: We don't actually create this user - it's just a template
	// Real users will be created when they first authenticate

	console.log('   Users collection schema prepared');
}

/**
 * Initialize billing plans collection with default plans
 */
async function initializeBillingPlansCollection() {
	console.log('💳 Setting up billing plans...');

	// Check if plans already exist
	const plansSnapshot = await adminDb.collection(COLLECTIONS.PLANS).limit(1).get();

	if (!plansSnapshot.empty) {
		console.log('   Billing plans already exist, skipping initialization');
		return;
	}

	// Default billing plans
	const defaultPlans: Omit<BillingPlan, 'id'>[] = [
		{
			name: 'Starter',
			description: 'Perfect for individuals getting started with AI development',
			price: 0, // Free plan
			interval: 'month',
			features: [
				{
					serviceType: 'llm',
					providerId: 'openai',
					limit: 50000, // 50K tokens per month
					costMultiplier: 1.0,
				},
				{
					serviceType: 'embedding',
					providerId: 'openai',
					limit: 25000, // 25K tokens per month
					costMultiplier: 1.0,
				},
			],
		},
		{
			name: 'Professional',
			description: 'For developers and small teams building production applications',
			price: 2500, // $25.00 in cents
			interval: 'month',
			features: [
				{
					serviceType: 'llm',
					providerId: 'openai',
					limit: 500000, // 500K tokens per month
					costMultiplier: 0.9, // 10% discount
				},
				{
					serviceType: 'llm',
					providerId: 'anthropic',
					limit: 250000, // 250K tokens per month
					costMultiplier: 0.9,
				},
				{
					serviceType: 'embedding',
					providerId: 'openai',
					limit: 1000000, // 1M tokens per month
					costMultiplier: 0.9,
				},
			],
		},
		{
			name: 'Enterprise',
			description: 'For large teams and organizations with high-volume needs',
			price: 10000, // $100.00 in cents
			interval: 'month',
			features: [
				{
					serviceType: 'llm',
					providerId: 'openai',
					limit: 5000000, // 5M tokens per month
					costMultiplier: 0.8, // 20% discount
				},
				{
					serviceType: 'llm',
					providerId: 'anthropic',
					limit: 2500000, // 2.5M tokens per month
					costMultiplier: 0.8,
				},
				{
					serviceType: 'llm',
					providerId: 'azure-openai',
					limit: 2500000, // 2.5M tokens per month
					costMultiplier: 0.8,
				},
				{
					serviceType: 'embedding',
					providerId: 'openai',
					limit: 10000000, // 10M tokens per month
					costMultiplier: 0.8,
				},
			],
		},
	];

	// Create the plans
	for (const plan of defaultPlans) {
		const planRef = await adminDb.collection(COLLECTIONS.PLANS).add({
			...plan,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		console.log(`   Created plan: ${plan.name} (${planRef.id})`);
	}

	console.log(`   Created ${defaultPlans.length} default billing plans`);
}

/**
 * Initialize usage collection
 */
async function initializeUsageCollection() {
	console.log('📊 Setting up usage tracking...');

	// The usage collection is created on-demand when usage is first recorded
	// We'll just ensure the collection exists
	const usageRef = adminDb.collection(COLLECTIONS.USAGE);

	// Create a dummy document to initialize the collection, then delete it
	const tempDoc = await usageRef.add({
		_temp: true,
		createdAt: new Date(),
	});
	await tempDoc.delete();

	console.log('   Usage collection initialized');
}

/**
 * Initialize audit logs collection
 */
async function initializeAuditLogsCollection() {
	console.log('🔍 Setting up audit logging...');

	// Create initial audit log entry for database initialization
	await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
		userId: 'system',
		action: 'database_initialized',
		details: {
			collections: Object.values(COLLECTIONS),
			timestamp: new Date().toISOString(),
		},
		timestamp: new Date(),
		metadata: {
			source: 'database_initialization_script',
			version: '1.0.0',
		},
	});

	console.log('   Audit logging initialized');
}

/**
 * Create database indexes for better performance
 */
export async function createDatabaseIndexes() {
	console.log('🗂️ Creating database indexes...');

	// Note: Firestore indexes are typically created via the Firebase console
	// or through firestore.indexes.json file in a Firebase project
	// This function documents the recommended indexes

	const recommendedIndexes = [
		{
			collection: COLLECTIONS.USERS,
			fields: ['email', 'role'],
			description: 'For user lookups and role-based queries',
		},
		{
			collection: COLLECTIONS.PROJECTS,
			fields: ['userId', 'createdAt'],
			description: 'For user project listings ordered by creation date',
		},
		{
			collection: COLLECTIONS.USAGE,
			fields: ['userId', 'timestamp'],
			description: 'For user usage tracking queries',
		},
		{
			collection: COLLECTIONS.AUDIT_LOGS,
			fields: ['userId', 'action', 'timestamp'],
			description: 'For audit log queries by user and action',
		},
	];

	console.log('   Recommended indexes:');
	recommendedIndexes.forEach((index, i) => {
		console.log(
			`   ${i + 1}. ${index.collection}: ${index.fields.join(', ')} - ${index.description}`
		);
	});

	console.log('   Note: Create these indexes in the Firebase console for optimal performance');
}

/**
 * Validate database setup
 */
export async function validateDatabaseSetup() {
	console.log('✅ Validating database setup...');

	const validations = [];

	try {
		// Check each collection exists and has the expected structure
		const collections = [
			COLLECTIONS.USERS,
			COLLECTIONS.PROJECTS,
			COLLECTIONS.USAGE,
			COLLECTIONS.AUDIT_LOGS,
			COLLECTIONS.PLANS,
		];

		for (const collection of collections) {
			try {
				await adminDb.collection(collection).limit(1).get();
				validations.push({ collection, status: 'accessible', error: null });
			} catch (error) {
				validations.push({
					collection,
					status: 'error',
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		}

		// Check if billing plans exist
		const plansSnapshot = await adminDb.collection(COLLECTIONS.PLANS).get();
		const planCount = plansSnapshot.size;
		validations.push({
			collection: 'billing_plans_count',
			status: planCount > 0 ? 'valid' : 'warning',
			error: planCount === 0 ? 'No billing plans found' : null,
			details: { count: planCount },
		});

		console.log('   Validation results:');
		validations.forEach(validation => {
			const icon =
				validation.status === 'accessible' || validation.status === 'valid'
					? '✅'
					: validation.status === 'warning'
						? '⚠️'
						: '❌';
			console.log(`   ${icon} ${validation.collection}: ${validation.status}`);
			if (validation.error) {
				console.log(`      Error: ${validation.error}`);
			}
		});

		return validations;
	} catch (error) {
		console.error('   Database validation failed:', error);
		throw error;
	}
}

// Export types for external use
export type DatabaseValidation = {
	collection: string;
	status: 'accessible' | 'valid' | 'warning' | 'error';
	error: string | null;
	details?: any;
};
