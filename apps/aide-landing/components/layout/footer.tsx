'use client';

import React from 'react';
import Link from 'next/link';
import { Code2, Sparkles, Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
	const navigation = {
		product: [
			{ name: 'Features', href: '#features' },
			{ name: 'Pricing', href: '#pricing' },
			{ name: 'Documentation', href: '/docs' },
			{ name: 'API Reference', href: '/api' },
		],
		company: [
			{ name: 'About', href: '/about' },
			{ name: 'Blog', href: '/blog' },
			{ name: 'Careers', href: '/careers' },
			{ name: 'Contact', href: '/contact' },
		],
		support: [
			{ name: 'Help Center', href: '/help' },
			{ name: 'Community', href: '/community' },
			{ name: 'Status', href: '/status' },
			{ name: 'Security', href: '/security' },
		],
		legal: [
			{ name: 'Privacy Policy', href: '/privacy' },
			{ name: 'Terms of Service', href: '/terms' },
			{ name: 'Cookie Policy', href: '/cookies' },
		],
	};

	const socialLinks = [
		{ name: 'GitHub', href: '#', icon: Github },
		{ name: 'Twitter', href: '#', icon: Twitter },
		{ name: 'LinkedIn', href: '#', icon: Linkedin },
	];

	return (
		<footer className="bg-background border-t border-border">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
					{/* Logo and Description */}
					<div className="lg:col-span-2">
						<div className="flex items-center space-x-2 mb-4">
							<div className="relative">
								<Code2 className="h-8 w-8 text-primary" />
								<Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1" />
							</div>
							<span className="text-2xl font-bold text-foreground">AIDE</span>
						</div>
						<p className="text-muted-foreground mb-6 max-w-md">
							The complete AI-powered development platform for modern software teams.
							Build, deploy, and scale with autonomous AI assistance.
						</p>
						<div className="flex space-x-4">
							{socialLinks.map((social) => (
								<Link
									key={social.name}
									href={social.href}
									className="text-muted-foreground hover:text-foreground transition-colors duration-200"
									aria-label={social.name}
								>
									<social.icon className="h-5 w-5" />
								</Link>
							))}
						</div>
					</div>

					{/* Navigation Links */}
					<div>
						<h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
							Product
						</h3>
						<ul className="space-y-3">
							{navigation.product.map((item) => (
								<li key={item.name}>
									<Link
										href={item.href}
										className="text-muted-foreground hover:text-foreground transition-colors duration-200"
									>
										{item.name}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
							Company
						</h3>
						<ul className="space-y-3">
							{navigation.company.map((item) => (
								<li key={item.name}>
									<Link
										href={item.href}
										className="text-muted-foreground hover:text-foreground transition-colors duration-200"
									>
										{item.name}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
							Support
						</h3>
						<ul className="space-y-3">
							{navigation.support.map((item) => (
								<li key={item.name}>
									<Link
										href={item.href}
										className="text-muted-foreground hover:text-foreground transition-colors duration-200"
									>
										{item.name}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
							Legal
						</h3>
						<ul className="space-y-3">
							{navigation.legal.map((item) => (
								<li key={item.name}>
									<Link
										href={item.href}
										className="text-muted-foreground hover:text-foreground transition-colors duration-200"
									>
										{item.name}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Bottom Section */}
				<div className="mt-12 pt-8 border-t border-border">
					<div className="flex flex-col md:flex-row justify-between items-center">
						<p className="text-muted-foreground text-sm">
							© 2025 AIDE. All rights reserved.
						</p>
						<p className="text-muted-foreground text-sm mt-4 md:mt-0">
							Made with ❤️ by the AIDE team
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
}
