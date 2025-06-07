/**
 * Configuration for the AIDE Control Panel
 * This Next.js application serves as the administrative interface
 * for managing the dual-mode infrastructure system
 */
const nextConfig = {
  // Configure environment variables
  env: {
    // API configuration
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.aide.example.com',

    // Default service mode
    DEFAULT_SERVICE_MODE: process.env.DEFAULT_SERVICE_MODE || 'managed',
  },

  // Image domains for Next.js Image component
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },

  // API routes rewrite rules
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://api.aide.example.com'}/:path*`,
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
    ignoreDuringBuilds: true
  }
};

module.exports = nextConfig;
