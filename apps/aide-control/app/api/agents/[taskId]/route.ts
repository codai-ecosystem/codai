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

/**
 * POST /api/agents/[taskId] - Send message to agents or update task
 */
async function updateTask(
	request: NextRequest,
	user: UserDocument,
	{ params }: { params: { taskId: string } }
) {
	try {
		const { taskId } = params;
		const body = await request.json();
		const { action, message, agentId } = body;

		if (!action) {
			return NextResponse.json({ error: 'Action is required' }, { status: 400 });
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

				// Start or continue conversation
				try {
					const conversation = await runtimeService.startConversation(
						taskId,
						user.uid,
						message,
						agentId ? [agentId] : ['planner']
					);

					result = {
						messageId: `msg_${Date.now()}`,
						status: 'sent',
						conversationId: conversation.id,
						message: 'Message sent to agents. Check back for responses.',
					};
				} catch (error) {
					console.error('Error sending message:', error);
					result = {
						status: 'error',
						message: 'Failed to send message to agents',
					};
				}
				break;

			case 'pause_task':
				// TODO: Implement task pausing in agent runtime
				result = {
					status: 'paused',
					message: 'Task paused successfully',
				};
				break;

			case 'resume_task':
				// TODO: Implement task resuming in agent runtime
				result = {
					status: 'in_progress',
					message: 'Task resumed successfully',
				};
				break;

			case 'cancel_task':
				// TODO: Implement task cancellation in agent runtime
				result = {
					status: 'cancelled',
					message: 'Task cancelled successfully',
				};
				break;

			default:
				return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
		}

		// Log task action for audit
		await FirestoreService.logAudit({
			userId: user.uid,
			action: 'UPDATE_TASK',
			resource: 'agent_task',
			resourceId: taskId,
			details: {
				action: `Performed task action: ${action}`,
				taskId,
				message: message || null,
			},
		});

		return NextResponse.json({
			success: true,
			data: result,
		});
	} catch (error) {
		console.error('Error updating task:', error);
		return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
	}
}

export const GET = (request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) => {
	return withAuth(async (req, user) => {
		try {
			const { taskId } = await params;
			const runtimeService = AgentRuntimeService.getInstance();

			const task = await runtimeService.getTask(taskId, user.uid);
			if (!task) {
				return NextResponse.json({ error: 'Task not found' }, { status: 404 });
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
					status: task.status,
				},
				ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
			});

			return NextResponse.json({
				success: true,
				data: {
					task: {
						...task,
						createdAt: task.createdAt.toISOString(),
						startedAt: task.startedAt?.toISOString(),
						completedAt: task.completedAt?.toISOString(),
					},
					conversation: conversation
						? {
								id: conversation.id,
								messages: conversation.context.messages.map(msg => ({
									id: msg.id,
									agentId: msg.agentId,
									type: msg.type,
									content: msg.content,
									timestamp: msg.timestamp.toISOString(),
									metadata: msg.metadata,
								})),
								lastActivity: conversation.lastActivity.toISOString(),
							}
						: null,
				},
			});
		} catch (error) {
			console.error('Error getting task:', error);
			return NextResponse.json({ error: 'Failed to get task details' }, { status: 500 });
		}
	})(request);
};

export const POST = (request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) => {
	return withAuth(async (req, user) => {
		try {
			const { taskId } = await params;
			const body = await request.json();
			const { action, message, agentId } = body;

			if (!action) {
				return NextResponse.json({ error: 'Action is required' }, { status: 400 });
			}

			const runtimeService = AgentRuntimeService.getInstance();
			let result;

			// Get the task to confirm it exists and belongs to this user
			const task = await runtimeService.getTask(taskId, user.uid);
			if (!task) {
				return NextResponse.json({ error: 'Task not found' }, { status: 404 });
			}

			switch (action) {
				case 'send_message':
					if (!message) {
						return NextResponse.json(
							{ error: 'Message is required for send_message action' },
							{ status: 400 }
						);
					}
					// Start or continue a conversation
					if (runtimeService.getConversation(taskId, user.uid)) {
						// TODO: Add appropriate method to continue conversation once implemented
						result = { message: 'Message received' };
					} else {
						// Start a new conversation
						result = await runtimeService.startConversation(taskId, user.uid, message, [
							agentId || task.agentId,
						]);
					}
					break;
				case 'cancel':
					// Manual access to private method - in production would add a public method
					await runtimeService['updateTaskStatus'](taskId, 'cancelled');
					result = { status: 'cancelled' };
					break;
				case 'retry':
					// For retry, we create a new task with the same parameters
					const newTask = await runtimeService.createTask(user.uid, {
						title: `Retry: ${task.title}`,
						description: task.description,
						agentId: task.agentId,
						inputs: task.inputs,
						priority: task.priority as 'low' | 'medium' | 'high' | 'critical',
						projectId: task.projectId,
					});
					result = {
						originalTaskId: taskId,
						newTaskId: newTask.id,
					};
					break;
				case 'change_agent':
					if (!agentId) {
						return NextResponse.json(
							{ error: 'Agent ID is required for change_agent action' },
							{ status: 400 }
						);
					}
					// Create a new task with the new agent
					const newAgentTask = await runtimeService.createTask(user.uid, {
						title: `${task.title} (Agent: ${agentId})`,
						description: task.description,
						agentId: agentId,
						inputs: task.inputs,
						priority: task.priority as 'low' | 'medium' | 'high' | 'critical',
						projectId: task.projectId,
					});
					result = {
						originalTaskId: taskId,
						newTaskId: newAgentTask.id,
						newAgent: agentId,
					};
					break;
				default:
					return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
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
					message: message || null,
				},
			});

			return NextResponse.json({
				success: true,
				data: result,
			});
		} catch (error) {
			console.error('Error updating task:', error);
			return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
		}
	})(request);
};
