/**
 * API route for project management
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../lib/auth-middleware';
import { FirestoreService, adminDb, type ProjectDocument } from '../../../lib/firebase-admin';

/**
 * GET /api/projects - List projects (paginated, filtered by user)
 */
export async function GET(request: NextRequest) {
	return withAuth(async (req, user) => {
		try {
			const { searchParams } = new URL(req.url);
			const page = parseInt(searchParams.get('page') || '1', 10);
			const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
			const search = searchParams.get('search') || '';
			const status = searchParams.get('status') as ProjectDocument['status'] || null;
			const type = searchParams.get('type') as ProjectDocument['type'] || null;

			// Build query
			let query = adminDb.collection('projects')
				.where('userId', '==', user.uid);

			// Add status filter
			if (status) {
				query = query.where('status', '==', status);
			}

			// Add type filter
			if (type) {
				query = query.where('type', '==', type);
			}

			// Order by creation date (newest first)
			query = query.orderBy('createdAt', 'desc');

			// Execute query with pagination
			const offset = (page - 1) * limit;
			const snapshot = await query.offset(offset).limit(limit).get();

			// Process results
			const projects: Array<ProjectDocument & { id: string }> = [];
			snapshot.forEach(doc => {
				const data = doc.data() as ProjectDocument;

				// Apply search filter (client-side for now)
				if (search && !data.name.toLowerCase().includes(search.toLowerCase()) &&
					!data.description?.toLowerCase().includes(search.toLowerCase())) {
					return;
				}

				// Remove sensitive data
				const { stripeProductId, ...safeProject } = data;
				projects.push({
					id: doc.id,
					...safeProject
				});
			});

			// Get total count for pagination
			const totalQuery = adminDb.collection('projects')
				.where('userId', '==', user.uid);
			const totalSnapshot = await totalQuery.count().get();
			const total = totalSnapshot.data().count;

			return NextResponse.json({
				success: true,
				projects,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
					hasNextPage: page * limit < total,
					hasPreviousPage: page > 1
				}
			});
		} catch (error) {
			console.error('Error listing projects:', error);
			return NextResponse.json(
				{ error: 'Failed to list projects' },
				{ status: 500 }
			);
		}
	})(request);
}

/**
 * POST /api/projects - Create a new project
 */
export async function POST(request: NextRequest) {
	return withAuth(async (req, user) => {
		try {
			const projectData = await req.json();

			// Validate required fields
			if (!projectData.name || typeof projectData.name !== 'string') {
				return NextResponse.json(
					{ error: 'Project name is required' },
					{ status: 400 }
				);
			}

			if (!projectData.type || !['web-app', 'api', 'static-site', 'function', 'other'].includes(projectData.type)) {
				return NextResponse.json(
					{ error: 'Valid project type is required' },
					{ status: 400 }
				);
			}

			// Check user's project limits
			const userProjectsQuery = adminDb.collection('projects')
				.where('userId', '==', user.uid)
				.where('status', '!=', 'deleted');
			const userProjectsSnapshot = await userProjectsQuery.count().get();
			const currentProjectCount = userProjectsSnapshot.data().count;

			if (currentProjectCount >= user.limits.projectsMax) {
				return NextResponse.json(
					{ error: 'Project limit reached for your plan' },
					{ status: 403 }
				);
			}

			// Create project document
			const now = new Date();
			const newProject: Omit<ProjectDocument, 'id'> = {
				userId: user.uid,
				name: projectData.name.trim(),
				description: projectData.description?.trim() || '',
				type: projectData.type,
				status: 'active',
				repository: {
					url: projectData.repository?.url || '',
					branch: projectData.repository?.branch || 'main',
					path: projectData.repository?.path || ''
				},
				deployment: {
					status: 'not_deployed',
					url: '',
					provider: 'cloud-run',
					lastDeployedAt: null,
					environment: 'production'
				}, settings: {
					buildCommand: projectData.settings?.buildCommand || '',
					outputDirectory: projectData.settings?.outputDirectory || '',
					environmentVariables: projectData.settings?.environmentVariables || {},
					customDomain: projectData.settings?.customDomain || '',
					autoSave: projectData.settings?.autoSave !== false,
					backupFrequency: projectData.settings?.backupFrequency || 'daily',
					visibility: projectData.settings?.visibility || 'private'
				},
				usage: {
					deploymentsThisMonth: 0,
					storageUsed: 0,
					bandwidthUsed: 0,
					buildMinutesUsed: 0
				},
				createdAt: now,
				updatedAt: now
			};

			// Add project to Firestore
			const projectRef = await adminDb.collection('projects').add(newProject);

			// Log audit entry
			await FirestoreService.logAudit({
				userId: user.uid,
				action: 'CREATE_PROJECT',
				resource: 'project',
				resourceId: projectRef.id,
				details: {
					action: 'Created new project',
					projectName: newProject.name,
					projectType: newProject.type
				}
			});

			// Return created project (without sensitive data)
			const { stripeProductId, ...safeProject } = newProject;
			return NextResponse.json({
				success: true,
				message: 'Project created successfully',
				project: {
					id: projectRef.id,
					...safeProject
				}
			}, { status: 201 });
		} catch (error) {
			console.error('Error creating project:', error);
			return NextResponse.json(
				{ error: 'Failed to create project' },
				{ status: 500 }
			);
		}
	})(request);
}
