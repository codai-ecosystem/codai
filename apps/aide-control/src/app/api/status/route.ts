import { NextRequest, NextResponse } from 'next/server';
import { ecosystemConfig, configValidation } from '@/lib/ecosystem-config';

interface StatusResponse {
	service: {
		name: string;
		version: string;
		environment: string;
		uptime: number;
		port: number;
	};
	ecosystem: {
		logai: {
			url: string;
			enabled: boolean;
			clientId: string;
		};
		memorai: {
			url: string;
			enabled: boolean;
			agentId: string;
		};
		central: {
			url: string;
			enabled: boolean;
		};
	};
	features: {
		authentication: boolean;
		memorySystem: boolean;
		projectSync: boolean;
		healthChecks: boolean;
	};
	configuration: {
		valid: boolean;
		errors: string[];
	};
	timestamp: string;
}

const startTime = Date.now();

export async function GET(request: NextRequest) {
	try {
		const statusResponse: StatusResponse = {
			service: {
				name: 'aide-control',
				version: '1.0.0',
				environment: ecosystemConfig.deployment.environment,
				uptime: Date.now() - startTime,
				port: ecosystemConfig.deployment.port,
			},
			ecosystem: {
				logai: {
					url: ecosystemConfig.services.logai.apiUrl,
					enabled: ecosystemConfig.services.logai.enabled,
					clientId: ecosystemConfig.services.logai.clientId,
				},
				memorai: {
					url: ecosystemConfig.services.memorai.apiUrl,
					enabled: ecosystemConfig.services.memorai.enabled,
					agentId: ecosystemConfig.services.memorai.agentId,
				},
				central: {
					url: ecosystemConfig.services.central.apiUrl,
					enabled: ecosystemConfig.services.central.enabled,
				},
			},
			features: ecosystemConfig.features,
			configuration: {
				valid: configValidation.length === 0,
				errors: configValidation,
			},
			timestamp: new Date().toISOString(),
		};

		return NextResponse.json(statusResponse, {
			status: 200,
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				'X-Codai-Service': 'aide-control',
				'X-Status-Check': 'true',
			},
		});
	} catch (error) {
		console.error('Status endpoint error:', error);

		return NextResponse.json(
			{
				error: 'Failed to retrieve status',
				timestamp: new Date().toISOString(),
			},
			{
				status: 500,
				headers: {
					'Cache-Control': 'no-cache, no-store, must-revalidate',
					'X-Codai-Service': 'aide-control',
					'X-Status-Check': 'true',
				},
			}
		);
	}
}
