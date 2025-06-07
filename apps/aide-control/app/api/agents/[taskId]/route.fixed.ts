/**
 * Agent Task Management API
 * Handles individual agent tasks and conversations
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../lib/auth-middleware';
import { UserDocument, FirestoreService } from '../../../../lib/firebase-admin';
import { AgentRuntimeService } from '../../../../lib/services/agent-runtime-service';

/**
 * GET /api/agents/[taskId] - Get task status and results
 */
export const GET = (
	request: NextRequest,
	{ params }: { params: { taskId: string } }
) => {
	return withAuth(async (req, user) => {
		try {
			const taskId = params.taskId;
			const runtimeService = AgentRuntimeService.getInstance();

			const task = await runtimeService.getTask(taskId, user.uid);
			if (!task) {
				return NextResponse.json(
					{ error: 'Task not found' },
					{ status: 404 }
				);
			}

			// Get conversation if available
			const conversation = runtimeService.getConversation(taskId, user.uid);
			// Log task access for audit
			await FirestoreService.logAudit({
				userId: user.uid,
				action: 'view_task',
				resource: 'agent_task',
				resourceId: taskId,
				details: {
					taskId,
					status: task.status
				},
				ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
			});

			return NextResponse.json({
				success: true,
				data: {
					task: {
						...task,
						createdAt: task.createdAt.toISOString(),
						updatedAt: task.updatedAt?.toISOString(),
					},
					conversation: conversation || null,
				}
			});
		} catch (error) {
			console.error('Error getting task:', error);
			return NextResponse.json(
				{ error: 'Failed to retrieve task' },
				{ status: 500 }
			);
		}
	})(request);
};

/**
 * POST /api/agents/[taskId] - Update task status or send a message
 */
export const POST = (
	request: NextRequest,
	{ params }: { params: { taskId: string } }
) => {
	return withAuth(async (req, user) => {
		try {
			const taskId = params.taskId;
			const body = await request.json();
			const { action, message, agentId } = body;

			if (!action) {
				return NextResponse.json(
					{ error: 'Action is required' },
					{ status: 400 }
				);
			}
			const runtimeService = AgentRuntimeService.getInstance();
			let result;

			switch (action) {
				case 'send_message':
					if (!message) {
						return NextResponse.json(
							{ error: 'Message is required for send_message action' },
							{ status: 400 }
						);
					}
					result = await runtimeService.sendMessage(taskId, user.uid, message);
					break;
				case 'cancel':
					result = await runtimeService.cancelTask(taskId, user.uid);
					break;
				case 'retry':
					result = await runtimeService.retryTask(taskId, user.uid);
					break;
				case 'change_agent':
					if (!agentId) {
						return NextResponse.json(
							{ error: 'Agent ID is required for change_agent action' },
							{ status: 400 }
						);
					}
					result = await runtimeService.changeAgent(taskId, user.uid, agentId);
					break;
				default:
					return NextResponse.json(
						{ error: `Unknown action: ${action}` },
						{ status: 400 }
					);
			}

			// Log the action for analytics and monitoring
			await FirestoreService.logAudit({
				userId: user.uid,
				action: `task_${action}`,
				resource: 'agent_task',
				resourceId: taskId,
				details: {
					action: `Performed task action: ${action}`,
					taskId,
					message: message || null
				}
			});

			return NextResponse.json({
				success: true,
				data: result
			});
		} catch (error) {
			console.error('Error updating task:', error);
			return NextResponse.json(
				{ error: 'Failed to update task' },
				{ status: 500 }
			);
		}
	})(request);
};
