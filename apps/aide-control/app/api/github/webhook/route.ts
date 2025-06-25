/**
 * GitHub webhook handler for processing GitHub App events
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminApp } from '../../../../lib/firebase-admin';

const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
	try {
		const body = await req.text();
		const signature = req.headers.get('x-hub-signature-256');

		if (!signature) {
			console.error('GitHub webhook: Missing signature');
			return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
		}

		// Verify webhook signature
		const expectedSignature = `sha256=${crypto
			.createHmac('sha256', webhookSecret)
			.update(body)
			.digest('hex')}`;

		if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
			console.error('GitHub webhook: Invalid signature');
			return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
		}

		const payload = JSON.parse(body);
		const eventType = req.headers.get('x-github-event');

		console.log(`GitHub webhook received: ${eventType}`, {
			action: payload.action,
			repository: payload.repository?.name,
			sender: payload.sender?.login,
		});

		const admin = getAdminApp();
		const db = (admin as any).firestore();

		// Handle different GitHub events
		switch (eventType) {
			case 'installation': {
				await handleInstallation(db, payload);
				break;
			}

			case 'installation_repositories': {
				await handleInstallationRepositories(db, payload);
				break;
			}

			case 'repository': {
				await handleRepository(db, payload);
				break;
			}

			case 'push': {
				await handlePush(db, payload);
				break;
			}

			case 'pull_request': {
				await handlePullRequest(db, payload);
				break;
			}

			case 'issues': {
				await handleIssues(db, payload);
				break;
			}

			case 'ping': {
				console.log('GitHub webhook ping received');
				break;
			}

			default: {
				console.log(`Unhandled GitHub event: ${eventType}`);
			}
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		console.error('GitHub webhook error:', error);
		return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
	}
}

/**
 * Handle GitHub App installation events
 */
async function handleInstallation(db: any, payload: any) {
	const { action, installation, repositories } = payload;

	console.log(`GitHub installation ${action}:`, {
		installationId: installation.id,
		account: installation.account.login,
		repositoryCount: repositories?.length || 0,
	});

	const installationData = {
		installationId: installation.id,
		accountId: installation.account.id,
		accountLogin: installation.account.login,
		accountType: installation.account.type,
		permissions: installation.permissions,
		repositorySelection: installation.repository_selection,
		createdAt: new Date(installation.created_at),
		updatedAt: new Date(installation.updated_at),
		events: installation.events,
		action,
		processedAt: new Date(),
	};

	try {
		switch (action) {
			case 'created': {
				// Store installation info
				await db
					.collection('github_installations')
					.doc(installation.id.toString())
					.set(installationData);

				// Store repository access if provided
				if (repositories) {
					for (const repo of repositories) {
						await db.collection('github_repositories').doc(repo.id.toString()).set({
							repositoryId: repo.id,
							name: repo.name,
							fullName: repo.full_name,
							private: repo.private,
							installationId: installation.id,
							accountLogin: installation.account.login,
							addedAt: new Date(),
						});
					}
				}
				break;
			}

			case 'deleted': {
				// Remove installation and associated repositories
				await db.collection('github_installations').doc(installation.id.toString()).delete();

				// Remove associated repositories
				const reposSnapshot = await db
					.collection('github_repositories')
					.where('installationId', '==', installation.id)
					.get();

				const batch = db.batch();
				reposSnapshot.docs.forEach((doc: any) => {
					batch.delete(doc.ref);
				});
				await batch.commit();
				break;
			}

			case 'suspend':
			case 'unsuspend': {
				await db
					.collection('github_installations')
					.doc(installation.id.toString())
					.update({
						...installationData,
						suspended: action === 'suspend',
					});
				break;
			}
		}
	} catch (error) {
		console.error('Error handling GitHub installation:', error);
		throw error;
	}
}

/**
 * Handle repository selection changes
 */
async function handleInstallationRepositories(db: any, payload: any) {
	const { action, installation, repositories_added, repositories_removed } = payload;

	console.log(`GitHub installation repositories ${action}:`, {
		installationId: installation.id,
		added: repositories_added?.length || 0,
		removed: repositories_removed?.length || 0,
	});

	try {
		// Add new repositories
		if (repositories_added) {
			for (const repo of repositories_added) {
				await db.collection('github_repositories').doc(repo.id.toString()).set({
					repositoryId: repo.id,
					name: repo.name,
					fullName: repo.full_name,
					private: repo.private,
					installationId: installation.id,
					accountLogin: installation.account.login,
					addedAt: new Date(),
				});
			}
		}

		// Remove repositories
		if (repositories_removed) {
			const batch = db.batch();
			for (const repo of repositories_removed) {
				const docRef = db.collection('github_repositories').doc(repo.id.toString());
				batch.delete(docRef);
			}
			await batch.commit();
		}
	} catch (error) {
		console.error('Error handling installation repositories:', error);
		throw error;
	}
}

/**
 * Handle repository events
 */
async function handleRepository(db: any, payload: any) {
	const { action, repository, installation } = payload;

	console.log(`GitHub repository ${action}:`, {
		repositoryId: repository.id,
		name: repository.full_name,
		installationId: installation?.id,
	});

	// Handle repository-specific events if needed
	// This could include tracking repository changes, deletions, etc.
}

/**
 * Handle push events
 */
async function handlePush(db: any, payload: any) {
	const { repository, pusher, commits, ref } = payload;

	console.log('GitHub push event:', {
		repository: repository.full_name,
		pusher: pusher.name,
		commitsCount: commits.length,
		ref,
	});

	// Handle push events if needed for AIDE workflow
	// This could trigger CI/CD, update project status, etc.
}

/**
 * Handle pull request events
 */
async function handlePullRequest(db: any, payload: any) {
	const { action, pull_request, repository } = payload;

	console.log(`GitHub pull request ${action}:`, {
		repository: repository.full_name,
		number: pull_request.number,
		title: pull_request.title,
	});

	// Handle PR events if needed for AIDE workflow
}

/**
 * Handle issues events
 */
async function handleIssues(db: any, payload: any) {
	const { action, issue, repository } = payload;

	console.log(`GitHub issue ${action}:`, {
		repository: repository.full_name,
		number: issue.number,
		title: issue.title,
	});

	// Handle issue events if needed for AIDE workflow
}
