import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		// Get the auth token from the cookie
		const token = request.cookies.get('auth-token')?.value;

		if (!token) {
			return NextResponse.json({ error: 'No authentication token found' }, { status: 401 });
		}

		// Clear the cookie after use
		const response = NextResponse.json({ token });
		response.cookies.set('auth-token', '', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 0,
			path: '/',
		});

		return response;
	} catch (error) {
		console.error('Get token error:', error);
		return NextResponse.json({ error: 'Failed to get authentication token' }, { status: 500 });
	}
}
