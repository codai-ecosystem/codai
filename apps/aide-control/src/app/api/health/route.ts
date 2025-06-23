import { NextRequest, NextResponse } from 'next/server';
import { ecosystemConfig } from '@/lib/ecosystem-config';

interface HealthCheckResponse {
	status: 'healthy' | 'degraded' | 'unhealthy';
	timestamp: string;
	service: string;
	version: string;
	ecosystem: {
		logai: 'available' | 'unavailable' | 'unknown';
		memorai: 'available' | 'unavailable' | 'unknown';
		codaiApi: 'available' | 'unavailable' | 'unknown';
	};
	uptime: number;
	environment: string;
}

const startTime = Date.now();

async function checkServiceHealth(url: string): Promise<'available' | 'unavailable' | 'unknown'> {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
		
		const response = await fetch(`${url}/health`, {
			signal: controller.signal,
			headers: {
				'User-Agent': 'Codai-AIDE-HealthCheck/1.0.0',
			},
		});
		
		clearTimeout(timeoutId);
		
		if (response.ok) {
			return 'available';
		} else {
			return 'unavailable';
		}
	} catch (error) {
		console.warn(`Health check failed for ${url}:`, error);
		return 'unknown';
	}
}

export async function GET(request: NextRequest) {
	try {
		const config = ecosystemConfig;
		
		// Check ecosystem services health in parallel
		const [logaiHealth, memoraiHealth, codaiApiHealth] = await Promise.all([
			checkServiceHealth(config.services.logai.apiUrl),
			checkServiceHealth(config.services.memorai.apiUrl),
			checkServiceHealth(config.services.central.apiUrl),
		]);
		
		// Determine overall health status
		const allServicesAvailable = [logaiHealth, memoraiHealth, codaiApiHealth].every(
			status => status === 'available'
		);
		const someServicesUnavailable = [logaiHealth, memoraiHealth, codaiApiHealth].some(
			status => status === 'unavailable'
		);
		
		let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
		if (allServicesAvailable) {
			overallStatus = 'healthy';
		} else if (someServicesUnavailable) {
			overallStatus = 'degraded';
		} else {
			overallStatus = 'unhealthy';
		}
		
		const healthResponse: HealthCheckResponse = {
			status: overallStatus,
			timestamp: new Date().toISOString(),
			service: 'aide-control',
			version: '1.0.0',
			ecosystem: {
				logai: logaiHealth,
				memorai: memoraiHealth,
				codaiApi: codaiApiHealth,
			},
			uptime: Date.now() - startTime,
			environment: process.env.NODE_ENV || 'development',
		};
		
		const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 206 : 503;
		
		return NextResponse.json(healthResponse, { 
			status: statusCode,
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				'X-Codai-Service': 'aide-control',
				'X-Health-Check': 'true',
			},
		});
	} catch (error) {
		console.error('Health check error:', error);
		
		const errorResponse: HealthCheckResponse = {
			status: 'unhealthy',
			timestamp: new Date().toISOString(),
			service: 'aide-control',
			version: '1.0.0',
			ecosystem: {
				logai: 'unknown',
				memorai: 'unknown',
				codaiApi: 'unknown',
			},
			uptime: Date.now() - startTime,
			environment: process.env.NODE_ENV || 'development',
		};
		
		return NextResponse.json(errorResponse, { 
			status: 503,
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				'X-Codai-Service': 'aide-control',
				'X-Health-Check': 'true',
			},
		});
	}
}
