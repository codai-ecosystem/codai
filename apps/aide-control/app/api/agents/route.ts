/**
 * Agent Runtime API
 * Provides endpoints for managing and interacting with the AIDE agent runtime
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../lib/auth-middleware';
import { UserDocument, FirestoreService } from '../../../lib/firebase-admin';
import { AgentRuntimeService } from '../../../lib/services/agent-runtime-service';

/**
 * GET /api/agents - Get agent status and available agents
 */
async function getAgents(request: NextRequest, user: UserDocument) {
	try {
		const runtimeService = AgentRuntimeService.getInstance(FirestoreService);
		const agents = await runtimeService.getAvailableAgents(user.uid);

		// Get runtime for status
		const runtime = await runtimeService.getOrCreateRuntime(user.uid);
		const statuses = runtime.getAgentStatuses();

		return NextResponse.json({
			success: true,
			data: {
				agents,
				runtime: {
					status: 'ready',
					version: '0.1.0',
					activeConversations: 0,
				},
			},
		});
	} catch (error) {
		console.error('Error getting agents:', error);
		return NextResponse.json({ error: 'Failed to get agents' }, { status: 500 });
	}
}

/**
 * POST /api/agents - Start agent conversation or task
 */
async function startAgentTask(request: NextRequest, user: UserDocument) {
	try {
		const body = await request.json();
		const { task, agentIds, projectId, context } = body;

		if (!task || !task.description) {
			return NextResponse.json({ error: 'Task description is required' }, { status: 400 });
		}

		const runtimeService = AgentRuntimeService.getInstance();

		// Create task
		const createdTask = await runtimeService.createTask(user.uid, {
			title: task.title || task.description.substring(0, 50) + '...',
			description: task.description,
			type: task.type || 'general',
			agentId: agentIds?.[0] || 'planner',
			projectId: projectId || undefined,
			inputs: {
				context: context || {},
				userMessage: task.description,
			},
			priority: task.priority || 'medium',
		});

		return NextResponse.json({
			success: true,
			data: {
				task: createdTask,
				message: 'Task created and started successfully.',
			},
		});
	} catch (error) {
		console.error('Error starting agent task:', error);
		return NextResponse.json({ error: 'Failed to start agent task' }, { status: 500 });
	}
}

export const GET = withAuth(getAgents);
export const POST = withAuth(startAgentTask);
