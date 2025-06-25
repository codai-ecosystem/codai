import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../../../lib/firebase-admin';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const code = searchParams.get('code');
		const state = searchParams.get('state');
		const error = searchParams.get('error');

		if (error) {
			console.error('OAuth error:', error);
			return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=oauth_error`);
		}

		if (!code || !state) {
			return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=missing_code`);
		}

		let accessToken: string;
		let userInfo: any;

		// Handle different OAuth providers based on state
		if (state === 'google_oauth') {
			// Exchange code for access token with Google
			const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
					client_secret: process.env.GOOGLE_CLIENT_SECRET!,
					code,
					grant_type: 'authorization_code',
					redirect_uri: `${process.env.NEXTAUTH_URL}/auth/callback`,
				}),
			});

			const tokenData = await tokenResponse.json();
			accessToken = tokenData.access_token;

			// Get user info from Google
			const userResponse = await fetch(
				`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
			);
			userInfo = await userResponse.json();
		} else if (state === 'github_oauth') {
			// Exchange code for access token with GitHub
			const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!,
					client_secret: process.env.GITHUB_CLIENT_SECRET!,
					code,
				}),
			});

			const tokenData = await tokenResponse.json();
			accessToken = tokenData.access_token;

			// Get user info from GitHub
			const userResponse = await fetch('https://api.github.com/user', {
				headers: {
					Authorization: `token ${accessToken}`,
					Accept: 'application/vnd.github.v3+json',
				},
			});
			userInfo = await userResponse.json();

			// Get user email if not public
			if (!userInfo.email) {
				const emailResponse = await fetch('https://api.github.com/user/emails', {
					headers: {
						Authorization: `token ${accessToken}`,
						Accept: 'application/vnd.github.v3+json',
					},
				});
				const emails = await emailResponse.json();
				const primaryEmail = emails.find((email: any) => email.primary);
				userInfo.email = primaryEmail?.email;
			}
		} else {
			return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=invalid_state`);
		}

		if (!userInfo.email) {
			return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=no_email`);
		}

		// Create or get user in Firebase
		let firebaseUser;
		try {
			firebaseUser = await adminAuth.getUserByEmail(userInfo.email);
		} catch (error) {
			// User doesn't exist, create new user
			firebaseUser = await adminAuth.createUser({
				email: userInfo.email,
				displayName: userInfo.name || userInfo.login,
				photoURL: userInfo.picture || userInfo.avatar_url,
				emailVerified: true,
			});
		}

		// Create custom token for client-side authentication
		const customToken = await adminAuth.createCustomToken(firebaseUser.uid);

		// Create a response that will redirect and pass the token
		const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/success`);

		// Set the custom token as a secure cookie
		response.cookies.set('auth-token', customToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60, // 1 hour
			path: '/',
		});

		return response;
	} catch (error) {
		console.error('OAuth callback error:', error);
		return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=oauth_callback_error`);
	}
}
