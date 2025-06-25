/**
 * Database Initialization API
 * Handles database setup and validation (admin only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../lib/auth-middleware';
import {
	initializeDatabase,
	validateDatabaseSetup,
	createDatabaseIndexes,
} from '../../../../lib/database-init';
import { adminDb, COLLECTIONS } from '../../../../lib/firebase-admin';

/**
 * GET /api/admin/database
 * Validate database setup
 */
async function validateDatabase(request: NextRequest) {
	try {
		const validations = await validateDatabaseSetup();

		return NextResponse.json({
			message: 'Database validation completed',
			validations,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Error validating database:', error);
		return NextResponse.json({ error: 'Failed to validate database setup' }, { status: 500 });
	}
}

/**
 * POST /api/admin/database
 * Initialize or reset database
 */
async function initDatabase(request: NextRequest) {
	try {
		const body = await request.json();
		const { action } = body;

		// Get user for audit logging
		const user = (request as any).user;

		switch (action) {
			case 'initialize': {
				const result = await initializeDatabase();

				// Log audit event
				await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
					userId: user.uid,
					action: 'database_initialized',
					details: {
						success: result.success,
						message: result.message,
					},
					timestamp: new Date(),
					metadata: {
						userAgent: request.headers.get('user-agent'),
						ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
					},
				});

				return NextResponse.json(result);
			}

			case 'validate': {
				const validations = await validateDatabaseSetup();

				return NextResponse.json({
					message: 'Database validation completed',
					validations,
					timestamp: new Date().toISOString(),
				});
			}

			case 'create_indexes': {
				await createDatabaseIndexes();

				// Log audit event
				await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add({
					userId: user.uid,
					action: 'database_indexes_documented',
					details: {
						message: 'Database index recommendations documented',
					},
					timestamp: new Date(),
					metadata: {
						userAgent: request.headers.get('user-agent'),
						ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
					},
				});

				return NextResponse.json({
					message: 'Database index recommendations documented',
					note: 'Create these indexes in the Firebase console for optimal performance',
				});
			}

			default:
				return NextResponse.json(
					{ error: 'Invalid action. Supported actions: initialize, validate, create_indexes' },
					{ status: 400 }
				);
		}
	} catch (error) {
		console.error('Error managing database:', error);
		return NextResponse.json({ error: 'Failed to manage database' }, { status: 500 });
	}
}

// Export handlers
export const GET = withAdminAuth(validateDatabase);
export const POST = withAdminAuth(initDatabase);
