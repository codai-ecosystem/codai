import type { NextConfig } from "next";

/**
 * Configuration for the AIDE Control Panel
 * This Next.js application serves as the administrative interface
 * for managing the dual-mode infrastructure system
 */
const nextConfig: NextConfig = {
	// Enable standalone output for Docker deployment
	output: 'standalone',

	// Disable server-side type checking during build to work around Firebase issues
	typescript: {
		// !! WARN !!
		// This ignores TypeScript errors during build
		// Re-enable this once all Firebase types are properly handled
		ignoreBuildErrors: process.env.NODE_ENV === 'production',
	},

	// For dynamic API routes, we need to tell Next.js not to attempt static optimization
	// This is necessary because our API routes use request headers for authentication
	experimental: {
		// Disable static page generation for specific paths
		// This ensures API endpoints aren't statically generated
		// and can access request context at runtime
		serverComponentsExternalPackages: ['firebase-admin']
	},

	// Configure environment variables
	env: {
		// API configuration
		API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.aide.example.com',

		// Default service mode
		DEFAULT_SERVICE_MODE: process.env.DEFAULT_SERVICE_MODE || 'managed',
		// Runtime config allows us to control features more easily
		ENABLE_MOCK_DATA: (process.env.ENABLE_MOCK_DATA === 'true' || !process.env.FIREBASE_ADMIN_CREDENTIALS) ? 'true' : 'false',
	},

	// Image domains for Next.js Image component
	images: {
		domains: ['firebasestorage.googleapis.com'],
	},
	// Enhanced security headers
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{
						key: 'X-Frame-Options',
						value: 'DENY',
					},
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff',
					},
					{
						key: 'X-XSS-Protection',
						value: '1; mode=block',
					},
					{
						key: 'Strict-Transport-Security',
						value: 'max-age=63072000; includeSubDomains; preload',
					},
					{
						key: 'Referrer-Policy',
						value: 'strict-origin-when-cross-origin',
					},
					{
						key: 'Permissions-Policy',
						value: 'camera=(), microphone=(), geolocation=()',
					},
					{
						key: 'Content-Security-Policy',
						value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseio.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com; img-src 'self' https://*.googleapis.com https://firebasestorage.googleapis.com data:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src https://*.firebaseapp.com;",
					}
				],
			},
		];
	},
};

export default nextConfig;
