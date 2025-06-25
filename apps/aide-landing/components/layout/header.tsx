'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Menu, X, Code2, Sparkles } from 'lucide-react';

export function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const navigation = [
		{ name: 'Features', href: '#features' },
		{ name: 'Pricing', href: '#pricing' },
		{ name: 'Testimonials', href: '#testimonials' },
		{ name: 'Docs', href: '/docs' },
	];

	return (
		<header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
			<nav className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					{/* Logo */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center space-x-2"
					>
						<div className="relative">
							<Code2 className="h-8 w-8 text-primary" />
							<Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1" />
						</div>
						<span className="text-2xl font-bold text-foreground">AIDE</span>
					</motion.div>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center space-x-8">
						{navigation.map(item => (
							<Link
								key={item.name}
								href={item.href}
								className="text-muted-foreground hover:text-foreground transition-colors duration-200"
							>
								{item.name}
							</Link>
						))}
					</div>

					{/* CTA Buttons */}
					<div className="hidden md:flex items-center space-x-4">
						<Link href={`${process.env.NEXT_PUBLIC_CONTROL_PANEL_URL}/login`}>
							<Button variant="ghost">Sign In</Button>
						</Link>
						<Link href={`${process.env.NEXT_PUBLIC_CONTROL_PANEL_URL}/signup`}>
							<Button>Get Started</Button>
						</Link>
					</div>

					{/* Mobile Menu Button */}
					<button
						className="md:hidden"
						onClick={() => setIsMenuOpen(!isMenuOpen)}
						aria-label="Toggle menu"
					>
						{isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
					</button>
				</div>

				{/* Mobile Navigation */}
				{isMenuOpen && (
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						className="md:hidden py-4 border-t border-border"
					>
						<div className="flex flex-col space-y-4">
							{navigation.map(item => (
								<Link
									key={item.name}
									href={item.href}
									className="text-muted-foreground hover:text-foreground transition-colors duration-200"
									onClick={() => setIsMenuOpen(false)}
								>
									{item.name}
								</Link>
							))}
							<div className="flex flex-col space-y-2 pt-4 border-t border-border">
								<Link href={`${process.env.NEXT_PUBLIC_CONTROL_PANEL_URL}/login`}>
									<Button variant="ghost" className="w-full">
										Sign In
									</Button>
								</Link>
								<Link href={`${process.env.NEXT_PUBLIC_CONTROL_PANEL_URL}/signup`}>
									<Button className="w-full">Get Started</Button>
								</Link>
							</div>
						</div>
					</motion.div>
				)}
			</nav>
		</header>
	);
}
