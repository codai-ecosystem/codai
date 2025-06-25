'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useInView } from '@/lib/hooks/use-in-view';

export function CTASection() {
	const [ref, isInView] = useInView({ threshold: 0.1 });
	const [email, setEmail] = useState('');

	const handleSignUp = () => {
		if (email) {
			// Redirect to control panel with email pre-filled
			window.open(
				`${process.env.NEXT_PUBLIC_CONTROL_PANEL_URL}/signup?email=${encodeURIComponent(email)}`,
				'_blank'
			);
		} else {
			// Redirect to control panel without email
			window.open(`${process.env.NEXT_PUBLIC_CONTROL_PANEL_URL}/signup`, '_blank');
		}
	};

	const handleGetStarted = () => {
		window.open(`${process.env.NEXT_PUBLIC_CONTROL_PANEL_URL}/signup`, '_blank');
	};

	return (
		<section className="py-24 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 relative overflow-hidden">
			{/* Background Effects */}
			<div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
			<div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-blob"></div>
			<div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>

			<div className="container mx-auto px-4 relative z-10">
				<div
					ref={ref}
					className={`text-center transition-all duration-1000 ${
						isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
					}`}
				>
					{/* Main CTA Content */}
					<div className="max-w-4xl mx-auto mb-12">
						<h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
							Ready to Transform Your
							<span className="text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
								{' '}
								Development Workflow?
							</span>
						</h2>
						<p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
							Join thousands of developers already using AIDE to build, deploy, and scale
							applications faster than ever before. Start your AI-powered development journey today.
						</p>
					</div>

					{/* CTA Options */}
					<div className="flex flex-col lg:flex-row items-center justify-center gap-8 mb-12">
						{/* Primary CTA */}
						<div className="flex flex-col items-center">
							<Button
								onClick={handleGetStarted}
								size="lg"
								className="text-lg px-8 py-4 h-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
							>
								Start Building for Free
							</Button>
							<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
								No credit card required • Free tier available
							</p>
						</div>

						{/* Email Signup */}
						<div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
							<input
								type="email"
								placeholder="Enter your email"
								value={email}
								onChange={e => setEmail(e.target.value)}
								className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
								onKeyDown={e => e.key === 'Enter' && handleSignUp()}
							/>
							<Button
								onClick={handleSignUp}
								variant="outline"
								size="lg"
								className="px-6 py-3 h-auto border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300"
							>
								Get Started
							</Button>
						</div>
					</div>

					{/* Trust Indicators */}
					<div className="flex flex-col items-center space-y-6">
						<div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
							<div className="flex items-center gap-2">
								<svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
									<path
										fillRule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clipRule="evenodd"
									/>
								</svg>
								<span>30-day money-back guarantee</span>
							</div>
							<div className="flex items-center gap-2">
								<svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
									<path
										fillRule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clipRule="evenodd"
									/>
								</svg>
								<span>Enterprise-grade security</span>
							</div>
							<div className="flex items-center gap-2">
								<svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
									<path
										fillRule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clipRule="evenodd"
									/>
								</svg>
								<span>24/7 support</span>
							</div>
						</div>

						{/* Social Proof */}
						<div className="text-center">
							<p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
								Trusted by developers at leading companies
							</p>
							<div className="flex flex-wrap justify-center items-center gap-8 opacity-60 grayscale">
								{/* Company logos would go here - using placeholder text for now */}
								<div className="text-2xl font-bold text-gray-400">Microsoft</div>
								<div className="text-2xl font-bold text-gray-400">Google</div>
								<div className="text-2xl font-bold text-gray-400">Meta</div>
								<div className="text-2xl font-bold text-gray-400">Netflix</div>
								<div className="text-2xl font-bold text-gray-400">Spotify</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
