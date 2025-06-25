import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const { token } = await request.json();

		if (!token) {
			return NextResponse.json({ error: 'No token provided' }, { status: 400 });
		}

		// This endpoint just returns success - the client will handle Firebase authentication
		// The custom token will be used on the client side with signInWithCustomToken
		return NextResponse.json({
			success: true,
			token: token,
		});
	} catch (error) {
		console.error('Custom token processing error:', error);
		return NextResponse.json({ error: 'Token processing failed' }, { status: 500 });
	}
}
