import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
	function middleware(req) {
		// Log access attempts for security monitoring
		console.log(
			`[Auth] ${req.method} ${req.url} - User: ${req.nextauth.token?.email || 'anonymous'}`
		);

		// Add Codai ecosystem headers
		const response = NextResponse.next();
		response.headers.set('X-Codai-Service', 'aide-control');
		response.headers.set('X-Codai-Version', '1.0.0');

		return response;
	},
	{
		callbacks: {
			authorized: ({ token, req }) => {
				// Public routes that don't require authentication
				const publicPaths = [
					'/api/health',
					'/api/status',
					'/login',
					'/register',
					'/about',
					'/_next',
					'/favicon',
					'/images',
					'/static',
				];

				// Check if the current path is public
				const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path));

				if (isPublicPath) {
					return true;
				}

				// For protected routes, require authentication
				return !!token;
			},
		},
	}
);

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api/auth (NextAuth.js routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		'/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
	],
};
