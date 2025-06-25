import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const provider = searchParams.get('provider');

		if (!provider || !['google', 'github'].includes(provider)) {
			return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
		}

		const redirectUri = `${process.env.NEXTAUTH_URL}/auth/callback`;
		const state = `${provider}_oauth`;

		let authUrl: string;

		if (provider === 'google') {
			const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
			if (!clientId) {
				return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 });
			}

			const scope = 'email profile openid';
			authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=${state}`;
		} else if (provider === 'github') {
			const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
			if (!clientId) {
				return NextResponse.json({ error: 'GitHub OAuth not configured' }, { status: 500 });
			}

			const scope = 'user:email';
			authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
		} else {
			return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
		}

		return NextResponse.json({ authUrl });
	} catch (error) {
		console.error('OAuth initiate error:', error);
		return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 });
	}
}
