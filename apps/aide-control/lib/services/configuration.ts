/**
 * Dynamic Configuration Service
 * Manages application configuration with environment variable overrides
 * and remote configuration capabilities
 */
import { adminDb } from '../firebase-admin';

export interface AppConfig {
	// Feature flags
	features: {
		githubProvisioning: boolean;
		firebaseProvisioning: boolean;
		stripeIntegration: boolean;
		usageTracking: boolean;
		adminDashboard: boolean;
		autoProvisioning: boolean;
	};

	// Plan configurations
	plans: {
		free: PlanConfig;
		professional: PlanConfig;
		enterprise: PlanConfig;
	};

	// Service limits and quotas
	quotas: {
		apiCallsWarningThreshold: number;
		computeWarningThreshold: number;
		storageWarningThreshold: number;
		quotaResetCronSchedule: string;
	};

	// External service configuration
	services: {
		github: {
			enabled: boolean;
			defaultTemplate: string;
			organizationName?: string;
			defaultVisibility: 'public' | 'private';
		};
		firebase: {
			enabled: boolean;
			defaultRegion: string;
			defaultPlan: 'spark' | 'blaze';
		};
		stripe: {
			enabled: boolean;
			webhookSecret?: string;
			defaultCurrency: string;
		};
	};

	// System settings
	system: {
		maintenanceMode: boolean;
		newUserRegistration: boolean;
		requireEmailVerification: boolean;
		sessionTimeoutMinutes: number;
		auditLogRetentionDays: number;
	};
}

export interface PlanConfig {
	name: string;
	displayName: string;
	description: string;
	price: number;
	interval: 'month' | 'year';
	limits: {
		apiCallsPerMonth: number;
		computeMinutesPerMonth: number;
		storageMBLimit: number;
		projectsMax: number;
		collaboratorsMax: number;
	};
	features: string[];
	stripeProductId?: string;
	stripePriceId?: string;
}

export class ConfigurationService {
	private static instance: ConfigurationService;
	private config: AppConfig | null = null;
	private lastFetchTime: number = 0;
	private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
	private readonly CONFIG_COLLECTION = 'configuration';
	private readonly CONFIG_DOC = 'app-config';

	private constructor() {}

	public static getInstance(): ConfigurationService {
		if (!ConfigurationService.instance) {
			ConfigurationService.instance = new ConfigurationService();
		}
		return ConfigurationService.instance;
	}

	/**
	 * Get current application configuration
	 */
	async getConfig(): Promise<AppConfig> {
		const now = Date.now();

		// Return cached config if still valid
		if (this.config && now - this.lastFetchTime < this.CACHE_DURATION) {
			return this.config;
		}

		try {
			// Try to fetch from remote configuration
			const remoteConfig = await this.fetchRemoteConfig();

			// Merge with environment overrides
			this.config = this.mergeWithEnvironmentOverrides(remoteConfig);
			this.lastFetchTime = now;

			return this.config;
		} catch (error) {
			console.error('Error fetching configuration, using defaults:', error);

			// Fall back to default configuration
			this.config = this.getDefaultConfig();
			return this.config;
		}
	}

	/**
	 * Fetch configuration from remote store (Firestore)
	 */
	private async fetchRemoteConfig(): Promise<AppConfig> {
		try {
			const configDoc = await adminDb.collection(this.CONFIG_COLLECTION).doc(this.CONFIG_DOC).get();

			if (configDoc.exists) {
				const remoteConfig = configDoc.data() as Partial<AppConfig>;
				return this.mergeWithDefaults(remoteConfig);
			}
		} catch (error) {
			console.warn('Could not fetch remote configuration:', error);
		}

		return this.getDefaultConfig();
	}

	/**
	 * Update remote configuration (admin only)
	 */
	async updateConfig(updates: Partial<AppConfig>): Promise<void> {
		try {
			await adminDb
				.collection(this.CONFIG_COLLECTION)
				.doc(this.CONFIG_DOC)
				.set(updates, { merge: true });

			// Clear cache to force refetch
			this.config = null;
			this.lastFetchTime = 0;
		} catch (error) {
			console.error('Error updating configuration:', error);
			throw new Error('Failed to update configuration');
		}
	}

	/**
	 * Get default configuration
	 */
	private getDefaultConfig(): AppConfig {
		return {
			features: {
				githubProvisioning: true,
				firebaseProvisioning: true,
				stripeIntegration: true,
				usageTracking: true,
				adminDashboard: true,
				autoProvisioning: false,
			},
			plans: {
				free: {
					name: 'free',
					displayName: 'Free',
					description: 'Perfect for getting started',
					price: 0,
					interval: 'month',
					limits: {
						apiCallsPerMonth: 1000,
						computeMinutesPerMonth: 60,
						storageMBLimit: 100,
						projectsMax: 3,
						collaboratorsMax: 1,
					},
					features: ['Basic IDE', 'GitHub Integration', 'Community Support'],
				},
				professional: {
					name: 'professional',
					displayName: 'Professional',
					description: 'For professional developers',
					price: 2000, // $20.00 in cents
					interval: 'month',
					limits: {
						apiCallsPerMonth: 10000,
						computeMinutesPerMonth: 300,
						storageMBLimit: 1000,
						projectsMax: 10,
						collaboratorsMax: 5,
					},
					features: ['Advanced IDE', 'All Integrations', 'Priority Support', 'Custom Environments'],
				},
				enterprise: {
					name: 'enterprise',
					displayName: 'Enterprise',
					description: 'For teams and organizations',
					price: 5000, // $50.00 in cents
					interval: 'month',
					limits: {
						apiCallsPerMonth: 50000,
						computeMinutesPerMonth: 1500,
						storageMBLimit: 10000,
						projectsMax: 50,
						collaboratorsMax: 25,
					},
					features: [
						'Enterprise IDE',
						'All Integrations',
						'Dedicated Support',
						'Custom Solutions',
						'SLA',
					],
				},
			},
			quotas: {
				apiCallsWarningThreshold: 0.8,
				computeWarningThreshold: 0.8,
				storageWarningThreshold: 0.8,
				quotaResetCronSchedule: '0 0 1 * *', // First day of each month
			},
			services: {
				github: {
					enabled: true,
					defaultTemplate: 'basic-project',
					defaultVisibility: 'private',
				},
				firebase: {
					enabled: true,
					defaultRegion: 'us-central1',
					defaultPlan: 'spark',
				},
				stripe: {
					enabled: true,
					defaultCurrency: 'usd',
				},
			},
			system: {
				maintenanceMode: false,
				newUserRegistration: true,
				requireEmailVerification: true,
				sessionTimeoutMinutes: 60,
				auditLogRetentionDays: 90,
			},
		};
	}

	/**
	 * Merge remote config with defaults
	 */
	private mergeWithDefaults(remoteConfig: Partial<AppConfig>): AppConfig {
		const defaultConfig = this.getDefaultConfig();

		return {
			features: { ...defaultConfig.features, ...remoteConfig.features },
			plans: {
				free: { ...defaultConfig.plans.free, ...remoteConfig.plans?.free },
				professional: { ...defaultConfig.plans.professional, ...remoteConfig.plans?.professional },
				enterprise: { ...defaultConfig.plans.enterprise, ...remoteConfig.plans?.enterprise },
			},
			quotas: { ...defaultConfig.quotas, ...remoteConfig.quotas },
			services: {
				github: { ...defaultConfig.services.github, ...remoteConfig.services?.github },
				firebase: { ...defaultConfig.services.firebase, ...remoteConfig.services?.firebase },
				stripe: { ...defaultConfig.services.stripe, ...remoteConfig.services?.stripe },
			},
			system: { ...defaultConfig.system, ...remoteConfig.system },
		};
	}

	/**
	 * Apply environment variable overrides
	 */
	private mergeWithEnvironmentOverrides(config: AppConfig): AppConfig {
		// Feature toggles from environment
		if (process.env.DISABLE_GITHUB_PROVISIONING === 'true') {
			config.features.githubProvisioning = false;
		}
		if (process.env.DISABLE_FIREBASE_PROVISIONING === 'true') {
			config.features.firebaseProvisioning = false;
		}
		if (process.env.DISABLE_STRIPE_INTEGRATION === 'true') {
			config.features.stripeIntegration = false;
		}
		if (process.env.ENABLE_AUTO_PROVISIONING === 'true') {
			config.features.autoProvisioning = true;
		}

		// Service configuration overrides
		if (process.env.GITHUB_DEFAULT_ORG) {
			config.services.github.organizationName = process.env.GITHUB_DEFAULT_ORG;
		}
		if (process.env.FIREBASE_DEFAULT_REGION) {
			config.services.firebase.defaultRegion = process.env.FIREBASE_DEFAULT_REGION;
		}
		if (process.env.STRIPE_WEBHOOK_SECRET) {
			config.services.stripe.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
		}

		// System overrides
		if (process.env.MAINTENANCE_MODE === 'true') {
			config.system.maintenanceMode = true;
		}
		if (process.env.DISABLE_NEW_REGISTRATIONS === 'true') {
			config.system.newUserRegistration = false;
		}

		return config;
	}

	/**
	 * Check if a feature is enabled
	 */
	async isFeatureEnabled(feature: keyof AppConfig['features']): Promise<boolean> {
		const config = await this.getConfig();
		return config.features[feature];
	}

	/**
	 * Get plan configuration
	 */
	async getPlanConfig(planName: 'free' | 'professional' | 'enterprise'): Promise<PlanConfig> {
		const config = await this.getConfig();
		return config.plans[planName];
	}

	/**
	 * Get service configuration
	 */
	async getServiceConfig<T extends keyof AppConfig['services']>(
		service: T
	): Promise<AppConfig['services'][T]> {
		const config = await this.getConfig();
		return config.services[service];
	}

	/**
	 * Check if system is in maintenance mode
	 */
	async isMaintenanceMode(): Promise<boolean> {
		const config = await this.getConfig();
		return config.system.maintenanceMode;
	}

	/**
	 * Initialize default configuration in database
	 */
	async initializeConfiguration(): Promise<void> {
		try {
			const configDoc = await adminDb.collection(this.CONFIG_COLLECTION).doc(this.CONFIG_DOC).get();

			if (!configDoc.exists) {
				const defaultConfig = this.getDefaultConfig();
				await adminDb.collection(this.CONFIG_COLLECTION).doc(this.CONFIG_DOC).set(defaultConfig);

				console.log('Default configuration initialized');
			}
		} catch (error) {
			console.error('Error initializing configuration:', error);
		}
	}
}
