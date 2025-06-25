/**
 * Codai Ecosystem Integration Configuration
 *
 * This file defines the configuration for integrating the codai service
 * with the broader codai ecosystem (LogAI, MemorAI, Central Platform)
 */

export interface EcosystemConfig {
	services: {
		logai: {
			apiUrl: string;
			clientId: string;
			enabled: boolean;
		};
		memorai: {
			apiUrl: string;
			agentId: string;
			enabled: boolean;
		};
		central: {
			apiUrl: string;
			enabled: boolean;
		};
	};
	deployment: {
		domain: string;
		port: number;
		environment: 'development' | 'staging' | 'production';
	};
	features: {
		authentication: boolean;
		memorySystem: boolean;
		projectSync: boolean;
		healthChecks: boolean;
	};
}

export const createEcosystemConfig = (): EcosystemConfig => {
	const isProduction = process.env.NODE_ENV === 'production';

	return {
		services: {
			logai: {
				apiUrl: process.env.LOGAI_API_URL || 'https://logai.codai.ro',
				clientId: process.env.LOGAI_CLIENT_ID || 'codai-web-client',
				enabled: !!process.env.LOGAI_CLIENT_SECRET,
			},
			memorai: {
				apiUrl: process.env.MEMORAI_API_URL || 'https://memorai.codai.ro',
				agentId: process.env.MEMORAI_AGENT_ID || 'codai-web-agent',
				enabled: !!process.env.MEMORAI_API_KEY,
			},
			central: {
				apiUrl: process.env.CODAI_CENTRAL_API || 'https://api.codai.ro',
				enabled: true, // Always enabled for health checks
			},
		},
		deployment: {
			domain:
				process.env.NEXT_PUBLIC_APP_URL ||
				(isProduction ? 'https://codai.ro' : 'http://localhost:3000'),
			port: parseInt(process.env.PORT || '3000', 10),
			environment: (process.env.NODE_ENV as any) || 'development',
		},
		features: {
			authentication: !!process.env.LOGAI_CLIENT_SECRET,
			memorySystem: !!process.env.MEMORAI_API_KEY,
			projectSync: !!process.env.CODAI_CENTRAL_API,
			healthChecks: true,
		},
	};
};

export const ecosystemConfig = createEcosystemConfig();

// Validation function
export const validateEcosystemConfig = (config: EcosystemConfig): string[] => {
	const errors: string[] = [];

	if (!config.services.logai.apiUrl) {
		errors.push('LogAI API URL is required');
	}

	if (!config.services.memorai.apiUrl) {
		errors.push('MemorAI API URL is required');
	}

	if (!config.services.central.apiUrl) {
		errors.push('Central API URL is required');
	}

	if (config.deployment.port < 1 || config.deployment.port > 65535) {
		errors.push('Invalid port number');
	}

	if (!['development', 'staging', 'production'].includes(config.deployment.environment)) {
		errors.push('Invalid environment');
	}

	return errors;
};

// Export validation status
export const configValidation = validateEcosystemConfig(ecosystemConfig);
