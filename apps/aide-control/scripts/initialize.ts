#!/usr/bin/env node
/**
 * AIDE Control Panel Initialization Script
 * Sets up required services, configuration, and default data for milestone 1
 */

import { ConfigurationService } from '../lib/services/configuration';
import { UsageTrackingService } from '../lib/services/usage-tracking';
import { FirestoreService, adminDb } from '../lib/firebase-admin';

interface InitializationResult {
	success: boolean;
	steps: Array<{
		name: string;
		success: boolean;
		error?: string;
	}>;
}

class AideInitializer {
	private results: InitializationResult = {
		success: true,
		steps: [],
	};

	async initialize(): Promise<InitializationResult> {
		console.log('🚀 Starting AIDE Control Panel initialization...\n');

		await this.runStep('Initialize Configuration Service', () => this.initializeConfiguration());
		await this.runStep('Setup Usage Tracking', () => this.setupUsageTracking());
		await this.runStep('Initialize Default Plans', () => this.initializeDefaultPlans());
		await this.runStep('Setup Collections and Indexes', () => this.setupCollectionsAndIndexes());
		await this.runStep('Create Admin User (if needed)', () => this.createAdminUser());
		await this.runStep('Verify Service Integration', () => this.verifyServiceIntegration());

		console.log('\n🎉 Initialization completed!');
		console.log(`✅ ${this.results.steps.filter(s => s.success).length} steps successful`);
		console.log(`❌ ${this.results.steps.filter(s => !s.success).length} steps failed`);

		if (!this.results.success) {
			console.log('\n⚠️  Some steps failed. Please review the errors above.');
			process.exit(1);
		}

		return this.results;
	}

	private async runStep(name: string, fn: () => Promise<void>): Promise<void> {
		console.log(`📋 ${name}...`);
		try {
			await fn();
			this.results.steps.push({ name, success: true });
			console.log(`   ✅ ${name} completed\n`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this.results.steps.push({ name, success: false, error: errorMessage });
			this.results.success = false;
			console.log(`   ❌ ${name} failed: ${errorMessage}\n`);
		}
	}

	private async initializeConfiguration(): Promise<void> {
		const configService = ConfigurationService.getInstance();
		await configService.initializeConfiguration();

		// Verify configuration is accessible
		const config = await configService.getConfig();
		console.log(`   📝 Configuration initialized with ${Object.keys(config.plans).length} plans`);
	}

	private async setupUsageTracking(): Promise<void> {
		const usageService = new UsageTrackingService();
		await usageService.initializeDefaultPlans();

		console.log('   📊 Usage tracking service initialized');
	}

	private async initializeDefaultPlans(): Promise<void> {
		const configService = ConfigurationService.getInstance();
		const config = await configService.getConfig();

		// Create billing plans in Firestore
		const planNames = Object.keys(config.plans) as Array<keyof typeof config.plans>;

		for (const planName of planNames) {
			const planConfig = config.plans[planName];

			try {
				await adminDb
					.collection('plans')
					.doc(planName)
					.set(
						{
							...planConfig,
							createdAt: new Date(),
							updatedAt: new Date(),
						},
						{ merge: true }
					);
			} catch (error) {
				console.log(`   ⚠️  Plan ${planName} already exists or failed to create`);
			}
		}

		console.log(`   💳 ${planNames.length} billing plans initialized`);
	}

	private async setupCollectionsAndIndexes(): Promise<void> {
		// Define required collections with their basic structure
		const collections = [
			{
				name: 'users',
				sampleDoc: { uid: 'sample', email: 'sample@example.com', role: 'user', plan: 'free' },
			},
			{
				name: 'usage',
				sampleDoc: { userId: 'sample', type: 'api-calls', amount: 1, timestamp: new Date() },
			},
			{
				name: 'audit',
				sampleDoc: { userId: 'sample', action: 'INIT', resource: 'system', timestamp: new Date() },
			},
			{ name: 'plans', sampleDoc: { name: 'free', displayName: 'Free Plan' } },
			{ name: 'configuration', sampleDoc: { type: 'app-config' } },
		];

		for (const collection of collections) {
			try {
				// Check if collection exists by trying to get a document
				const snapshot = await adminDb.collection(collection.name).limit(1).get();

				if (snapshot.empty) {
					// Create a sample document to initialize the collection
					await adminDb
						.collection(collection.name)
						.doc('_init')
						.set({
							...collection.sampleDoc,
							_isInitDoc: true,
							createdAt: new Date(),
						});

					// Delete the init document
					await adminDb.collection(collection.name).doc('_init').delete();
				}
			} catch (error) {
				console.log(`   ⚠️  Could not initialize collection ${collection.name}: ${error}`);
			}
		}

		console.log(`   🗄️  ${collections.length} collections verified/initialized`);
	}

	private async createAdminUser(): Promise<void> {
		const adminEmail = process.env.ADMIN_EMAIL || 'admin@aide.dev';

		try {
			// Check if admin user already exists
			const existingAdmin = await adminDb
				.collection('users')
				.where('email', '==', adminEmail)
				.where('role', '==', 'admin')
				.limit(1)
				.get();

			if (existingAdmin.empty) {
				// Create admin user document (Firebase Auth user should be created separately)
				const adminUserDoc = {
					uid: 'admin-' + Date.now(),
					email: adminEmail,
					displayName: 'System Administrator',
					role: 'admin' as const,
					plan: 'enterprise' as const,
					status: 'active' as const,
					createdAt: new Date(),
					updatedAt: new Date(),
					preferences: {
						theme: 'system' as const,
						notifications: true,
						language: 'en',
					},
					limits: {
						tokensPerMonth: 1000000,
						projectsMax: 100,
						deploymentsPerMonth: 1000,
					},
				};

				await adminDb.collection('users').doc(adminUserDoc.uid).set(adminUserDoc);
				console.log(`   👤 Admin user created: ${adminEmail}`);
			} else {
				console.log(`   👤 Admin user already exists: ${adminEmail}`);
			}
		} catch (error) {
			console.log(`   ⚠️  Could not create admin user: ${error}`);
		}
	}

	private async verifyServiceIntegration(): Promise<void> {
		// Test each service to ensure they're working
		const tests = [
			{
				name: 'Configuration Service',
				test: async () => {
					const configService = ConfigurationService.getInstance();
					const config = await configService.getConfig();
					return config.features.githubProvisioning !== undefined;
				},
			},
			{
				name: 'Usage Tracking Service',
				test: async () => {
					const usageService = new UsageTrackingService();
					const stats = await usageService.getSystemStats();
					return stats.totalUsers !== undefined;
				},
			},
			{
				name: 'Firestore Connection',
				test: async () => {
					const testDoc = await adminDb.collection('_test').doc('connection').set({
						timestamp: new Date(),
						test: true,
					});
					await adminDb.collection('_test').doc('connection').delete();
					return true;
				},
			},
		];

		let passedTests = 0;
		for (const test of tests) {
			try {
				const result = await test.test();
				if (result) {
					passedTests++;
					console.log(`   ✅ ${test.name} working`);
				} else {
					console.log(`   ❌ ${test.name} test failed`);
				}
			} catch (error) {
				console.log(`   ❌ ${test.name} error: ${error}`);
			}
		}

		if (passedTests !== tests.length) {
			throw new Error(`Only ${passedTests}/${tests.length} service integration tests passed`);
		}

		console.log(`   🔧 All ${tests.length} service integration tests passed`);
	}
}

// Run initialization if this script is executed directly
if (require.main === module) {
	const initializer = new AideInitializer();
	initializer.initialize().catch(error => {
		console.error('Initialization failed:', error);
		process.exit(1);
	});
}

export { AideInitializer };
