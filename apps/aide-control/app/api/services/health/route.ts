/**
 * API route for service manager health check
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '../../../../lib/server/auth-middleware';
import { serviceManager } from '../../../../lib/services/service-manager';

/**
 * GET /api/services/health - Service manager health check (admin only)
 */
export function GET(req: NextRequest) {
	return withAdmin(async (req, { uid }) => {
		try {
			const health = await serviceManager.healthCheck();

			return NextResponse.json({
				status: 'healthy',
				services: health,
				timestamp: new Date().toISOString()
			});
		} catch (error) {
			console.error('Error checking service health:', error);
			return NextResponse.json(
				{
					status: 'unhealthy',
					error: 'Failed to check service health',
					timestamp: new Date().toISOString()
				},
				{ status: 500 }
			);
		}
	})(req);
}
