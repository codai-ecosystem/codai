/**
 * Simple health check endpoint for the AIDE Control Panel
 * Used by Google Cloud Run and other services to determine if the application is healthy
 */
import { NextResponse } from 'next/server';

/**
 * Health check handler
 *
 * @returns A 200 OK response if the server is healthy
 */
export async function GET() {
	return NextResponse.json(
		{
			status: 'ok',
			timestamp: new Date().toISOString(),
			service: 'aide-control',
			version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0'
		},
		{ status: 200 }
	);
}
