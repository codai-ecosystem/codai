/**
 * Configuration for the Codai Control Panel
 * This Next.js application serves as the central platform and AIDE hub
 * for the Codai ecosystem
 */
const nextConfig = {
	// Configure environment variables for Codai ecosystem
	env: {
		// Codai ecosystem configuration
		CODAI_DOMAIN: process.env.CODAI_DOMAIN || 'codai.ro',
		NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

		// LogAI authentication service
		LOGAI_API_URL: process.env.LOGAI_API_URL || 'https://logai.codai.ro',

		// MemorAI memory service
		MEMORAI_API_URL: process.env.MEMORAI_API_URL || 'https://memorai.codai.ro',

		// Central Codai platform API
		CODAI_API_URL: process.env.CODAI_API_URL || 'https://api.codai.ro',

		// Default service mode
		DEFAULT_SERVICE_MODE: process.env.DEFAULT_SERVICE_MODE || 'managed',
	},

	// Image domains for Next.js Image component (Codai ecosystem)
	images: {
		domains: [
			'firebasestorage.googleapis.com',
			'cdn.codai.ro',
			'assets.codai.ro',
			'images.codai.ro',
		],
	},

	// API routes rewrite rules for Codai ecosystem
	async rewrites() {
		return [
			{
				source: '/api/logai/:path*',
				destination: `${process.env.LOGAI_API_URL || 'https://logai.codai.ro'}/api/:path*`,
			},
			{
				source: '/api/memorai/:path*',
				destination: `${process.env.MEMORAI_API_URL || 'https://memorai.codai.ro'}/api/:path*`,
			},
			{
				source: '/api/codai/:path*',
				destination: `${process.env.CODAI_API_URL || 'https://api.codai.ro'}/:path*`,
			},
		];
	},

	// Security headers
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
				],
			},
		];
	},
	// Enable standalone output for Docker deployment
	output: 'standalone',

	// Optimize build for Docker by excluding unnecessary files
	outputFileTracingExcludes: {
		'*': [
			'node_modules/@swc/core-linux-x64-gnu',
			'node_modules/@swc/core-linux-x64-musl',
			'node_modules/@esbuild/linux-x64',
		],
	},
	// During Docker build, minimize static generation to avoid Firebase issues
	typescript: {
		// Allow production builds to successfully complete even if
		// TypeScript errors are present
		ignoreBuildErrors: true,
	},

	// Ignore ESLint errors during build
	eslint: {
		ignoreDuringBuilds: true,
	},
};

module.exports = nextConfig;
