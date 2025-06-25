/**
 * First-time Setup Wizard API
 * Guides new users through initial AIDE setup and backend provisioning
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../lib/auth-middleware';
import { UserDocument, FirestoreService } from '../../../lib/firebase-admin';
import { BackendProvisioningService } from '../../../lib/services/backend-provisioning';
import { ConfigurationService } from '../../../lib/services/configuration';

interface SetupStep {
	id: string;
	title: string;
	description: string;
	status: 'pending' | 'in_progress' | 'completed' | 'failed';
	optional: boolean;
	dependencies?: string[];
}

/**
 * GET /api/setup - Get setup status and next steps
 */
async function getSetupStatus(request: NextRequest, user: UserDocument) {
	try {
		// Check current setup status for the user
		const userDoc = await FirestoreService.getUserDocument(user.uid);
		const setupCompleted = userDoc?.setupCompleted || false;
		const setupSteps = userDoc?.setupSteps || {};

		// Define the setup steps
		const steps: SetupStep[] = [
			{
				id: 'profile',
				title: 'Complete Profile',
				description: 'Add your display name and basic information',
				status: userDoc?.displayName ? 'completed' : 'pending',
				optional: false,
			},
			{
				id: 'plan',
				title: 'Choose Your Plan',
				description: 'Select a subscription plan that fits your needs',
				status: userDoc?.plan && userDoc.plan !== 'free' ? 'completed' : 'pending',
				optional: false,
			},
			{
				id: 'github',
				title: 'Connect GitHub',
				description: 'Link your GitHub account for repository management',
				status: setupSteps.github || 'pending',
				optional: false,
				dependencies: ['profile', 'plan'],
			},
			{
				id: 'project',
				title: 'Create First Project',
				description: 'Set up your first AIDE project and development environment',
				status: setupSteps.project || 'pending',
				optional: false,
				dependencies: ['github'],
			},
			{
				id: 'agent',
				title: 'Test AI Agents',
				description: 'Try out the AI agents with a simple task',
				status: setupSteps.agent || 'pending',
				optional: true,
				dependencies: ['project'],
			},
		];

		// Calculate overall progress
		const completedSteps = steps.filter(step => step.status === 'completed').length;
		const totalSteps = steps.filter(step => !step.optional).length;
		const progress = Math.round((completedSteps / totalSteps) * 100);

		// Get next step
		const nextStep = steps.find(
			step =>
				step.status === 'pending' &&
				(!step.dependencies ||
					step.dependencies.every(dep => steps.find(s => s.id === dep)?.status === 'completed'))
		);

		return NextResponse.json({
			success: true,
			data: {
				completed: setupCompleted,
				progress,
				steps,
				nextStep,
				user: {
					displayName: userDoc?.displayName,
					email: userDoc?.email,
					plan: userDoc?.plan || 'free',
					role: userDoc?.role || 'user',
				},
			},
		});
	} catch (error) {
		console.error('Error getting setup status:', error);
		return NextResponse.json({ error: 'Failed to get setup status' }, { status: 500 });
	}
}

/**
 * POST /api/setup - Complete a setup step
 */
async function completeSetupStep(request: NextRequest, user: UserDocument) {
	try {
		const body = await request.json();
		const { stepId, data } = body;

		if (!stepId) {
			return NextResponse.json({ error: 'Step ID is required' }, { status: 400 });
		}

		const provisioningService = new BackendProvisioningService();
		const configService = ConfigurationService.getInstance();

		let result: any = {};

		switch (stepId) {
			case 'profile':
				if (!data?.displayName) {
					return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
				}

				await FirestoreService.setUserDocument(user.uid, {
					displayName: data.displayName,
					setupSteps: { profile: 'completed' },
				});

				result = { message: 'Profile updated successfully' };
				break;

			case 'plan':
				if (!data?.planId) {
					return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
				}

				// This would normally create a Stripe checkout session
				// For now, just update the user's plan
				await FirestoreService.setUserDocument(user.uid, {
					plan: data.planId,
					setupSteps: { plan: 'completed' },
				});

				result = {
					message: 'Plan selected successfully',
					redirectUrl: data.planId === 'free' ? null : '/billing/checkout',
				};
				break;

			case 'github':
				if (!data?.githubUsername) {
					return NextResponse.json({ error: 'GitHub username is required' }, { status: 400 });
				}

				// Mark step as in progress
				await FirestoreService.setUserDocument(user.uid, {
					setupSteps: { github: 'in_progress' },
				});

				// TODO: Integrate with actual GitHub OAuth flow
				// For now, simulate GitHub connection
				await FirestoreService.setUserDocument(user.uid, {
					githubUsername: data.githubUsername,
					setupSteps: { github: 'completed' },
				});

				result = {
					message: 'GitHub connected successfully',
					githubUsername: data.githubUsername,
				};
				break;

			case 'project':
				if (!data?.projectName || !data?.projectType) {
					return NextResponse.json(
						{ error: 'Project name and type are required' },
						{ status: 400 }
					);
				}

				// Mark step as in progress
				await FirestoreService.setUserDocument(user.uid, {
					setupSteps: { project: 'in_progress' },
				});

				const userDoc = await FirestoreService.getUserDocument(user.uid);

				// Provision backend services for the user
				const provisioningResult = await provisioningService.provisionUser({
					userId: user.uid,
					email: user.email,
					displayName: userDoc?.displayName || user.email,
					plan: (userDoc?.plan as 'free' | 'professional' | 'enterprise') || 'free',
					projectName: data.projectName,
					projectType: data.projectType,
					projectId: `${user.uid}-${Date.now()}`,
					services: ['github', 'firebase'],
					environmentType: 'development',
				});

				if (provisioningResult.success) {
					await FirestoreService.setUserDocument(user.uid, {
						firstProjectId: provisioningResult.projectId,
						setupSteps: { project: 'completed' },
					});

					result = {
						message: 'Project created successfully',
						project: {
							id: provisioningResult.projectId,
							name: data.projectName,
							type: data.projectType,
							services: provisioningResult.services,
						},
					};
				} else {
					await FirestoreService.setUserDocument(user.uid, {
						setupSteps: { project: 'failed' },
					});

					return NextResponse.json(
						{ error: 'Failed to create project', details: provisioningResult.errors },
						{ status: 500 }
					);
				}
				break;

			case 'agent':
				// Mark agent setup as completed
				await FirestoreService.setUserDocument(user.uid, {
					setupSteps: { agent: 'completed' },
				});

				result = {
					message: 'Agent test completed successfully',
					nextSteps: ['Start building with AI agents', 'Explore the dashboard'],
				};
				break;

			default:
				return NextResponse.json({ error: `Unknown setup step: ${stepId}` }, { status: 400 });
		}

		// Check if setup is now complete
		const updatedUserDoc = await FirestoreService.getUserDocument(user.uid);
		const setupSteps = updatedUserDoc?.setupSteps || {};
		const requiredSteps = ['profile', 'plan', 'github', 'project'];
		const allRequiredCompleted = requiredSteps.every(step => setupSteps[step] === 'completed');

		if (allRequiredCompleted && !updatedUserDoc?.setupCompleted) {
			await FirestoreService.setUserDocument(user.uid, {
				setupCompleted: true,
				setupCompletedAt: new Date(),
			});
		}

		// Log setup step completion
		await FirestoreService.logAudit({
			userId: user.uid,
			action: 'COMPLETE_SETUP_STEP',
			resource: 'setup',
			resourceId: stepId,
			details: {
				action: `Completed setup step: ${stepId}`,
				stepData: data,
			},
		});

		return NextResponse.json({
			success: true,
			data: result,
		});
	} catch (error) {
		console.error('Error completing setup step:', error);
		return NextResponse.json({ error: 'Failed to complete setup step' }, { status: 500 });
	}
}

export const GET = withAuth(getSetupStatus);
export const POST = withAuth(completeSetupStep);
