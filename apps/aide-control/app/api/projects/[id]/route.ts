/**
 * API route for individual project management
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../lib/auth-middleware';
import { FirestoreService, adminDb, type ProjectDocument } from '../../../../lib/firebase-admin';

/**
 * GET /api/projects/[id] - Get a specific project
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withAuth(async (request, user) => {
		try {
			const { id: projectId } = await params;

			// Get project document from Firestore
			const projectDoc = await adminDb.collection('projects').doc(projectId).get();
			if (!projectDoc.exists) {
				return NextResponse.json({ error: 'Project not found' }, { status: 404 });
			}

			const projectData = projectDoc.data() as ProjectDocument;

			// Check if user owns this project
			if (projectData.userId !== user.uid) {
				return NextResponse.json({ error: 'Access denied' }, { status: 403 });
			}

			// Remove sensitive data before returning
			const { stripeProductId, ...safeProject } = projectData;

			return NextResponse.json({
				success: true,
				project: {
					id: projectId,
					...safeProject,
				},
			});
		} catch (error) {
			console.error('Error getting project:', error);
			return NextResponse.json({ error: 'Failed to retrieve project' }, { status: 500 });
		}
	})(req);
}

/**
 * PUT /api/projects/[id] - Update a specific project
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withAuth(async (request, user) => {
		try {
			const { id: projectId } = await params;
			const updateData = await request.json();

			// Get existing project
			const projectDoc = await adminDb.collection('projects').doc(projectId).get();
			if (!projectDoc.exists) {
				return NextResponse.json({ error: 'Project not found' }, { status: 404 });
			}

			const existingProject = projectDoc.data() as ProjectDocument;

			// Check if user owns this project
			if (existingProject.userId !== user.uid) {
				return NextResponse.json({ error: 'Access denied' }, { status: 403 });
			}

			// Validate update data
			const allowedFields = [
				'name',
				'description',
				'type',
				'status',
				'repository',
				'deployment',
				'settings',
			];
			const filteredData: Partial<ProjectDocument> = {};

			for (const field of allowedFields) {
				if (updateData[field] !== undefined) {
					(filteredData as any)[field] = updateData[field];
				}
			}

			// Validate required fields if being updated
			if (filteredData.name && typeof filteredData.name !== 'string') {
				return NextResponse.json({ error: 'Project name must be a string' }, { status: 400 });
			}

			if (
				filteredData.type &&
				!['web-app', 'api', 'static-site', 'function', 'other'].includes(filteredData.type)
			) {
				return NextResponse.json({ error: 'Invalid project type' }, { status: 400 });
			}

			// Update project document
			filteredData.updatedAt = new Date();
			await adminDb.collection('projects').doc(projectId).update(filteredData);

			// Log audit entry
			await FirestoreService.logAudit({
				userId: user.uid,
				action: 'UPDATE_PROJECT',
				resource: 'project',
				resourceId: projectId,
				details: {
					action: 'Updated project',
					projectName: filteredData.name || existingProject.name,
					updatedFields: Object.keys(filteredData),
				},
			});

			// Get updated project data
			const updatedProjectDoc = await adminDb.collection('projects').doc(projectId).get();
			const updatedProject = updatedProjectDoc.data() as ProjectDocument;
			const { stripeProductId, ...safeProject } = updatedProject;

			return NextResponse.json({
				success: true,
				message: 'Project updated successfully',
				project: {
					id: projectId,
					...safeProject,
				},
			});
		} catch (error) {
			console.error('Error updating project:', error);
			return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
		}
	})(req);
}

/**
 * DELETE /api/projects/[id] - Delete a specific project
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	return withAuth(async (request, user) => {
		try {
			const { id: projectId } = await params;

			// Get existing project
			const projectDoc = await adminDb.collection('projects').doc(projectId).get();
			if (!projectDoc.exists) {
				return NextResponse.json({ error: 'Project not found' }, { status: 404 });
			}

			const existingProject = projectDoc.data() as ProjectDocument;

			// Check if user owns this project
			if (existingProject.userId !== user.uid) {
				return NextResponse.json({ error: 'Access denied' }, { status: 403 });
			}

			// Soft delete by updating status (preserve data for recovery)
			await adminDb.collection('projects').doc(projectId).update({
				status: 'deleted',
				updatedAt: new Date(),
			});

			// Log audit entry
			await FirestoreService.logAudit({
				userId: user.uid,
				action: 'DELETE_PROJECT',
				resource: 'project',
				resourceId: projectId,
				details: {
					action: 'Deleted project',
					projectName: existingProject.name,
					projectType: existingProject.type,
				},
			});

			return NextResponse.json({
				success: true,
				message: 'Project deleted successfully',
			});
		} catch (error) {
			console.error('Error deleting project:', error);
			return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
		}
	})(req);
}
