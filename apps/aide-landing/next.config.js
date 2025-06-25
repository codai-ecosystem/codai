/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		domains: ['images.unsplash.com', 'avatars.githubusercontent.com'],
	},
	env: {
		NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
		NEXT_PUBLIC_CONTROL_PANEL_URL:
			process.env.NEXT_PUBLIC_CONTROL_PANEL_URL || 'http://localhost:3000',
	},
};

module.exports = nextConfig;
