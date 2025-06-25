'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
	ArrowRight,
	Play,
	Code2,
	Zap,
	Brain,
	Rocket,
	Download,
	Github,
	MessageSquare,
} from 'lucide-react';
import { DownloadButton } from '@/components/ui/download-button';

export function HeroSection() {
	const fadeInUp = {
		initial: { opacity: 0, y: 60 },
		animate: { opacity: 1, y: 0 },
		transition: { duration: 0.6 },
	};

	const stagger = {
		animate: {
			transition: {
				staggerChildren: 0.1,
			},
		},
	};

	const iconVariants = {
		initial: { scale: 0.8, opacity: 0 },
		animate: { scale: 1, opacity: 1 },
		hover: { scale: 1.2, rotate: 10 },
	};

	return (
		<section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 pt-16">
			{/* Enhanced Background Effects */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
				<div className="absolute top-40 left-40 w-80 h-80 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

				{/* Grid Pattern */}
				<div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />

				{/* Floating Code Elements */}
				<motion.div
					className="absolute top-20 left-10 text-primary/30 text-2xl font-mono"
					animate={{ y: [-20, 20, -20] }}
					transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
				>
					{'{ ai: "native" }'}
				</motion.div>
				<motion.div
					className="absolute bottom-32 right-20 text-purple-500/30 text-xl font-mono"
					animate={{ y: [20, -20, 20] }}
					transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
				>
					console.log("building...")
				</motion.div>
			</div>

			<div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
				<motion.div
					variants={stagger}
					initial="initial"
					animate="animate"
					className="text-center max-w-5xl mx-auto"
				>
					{/* Badge */}
					<motion.div
						variants={fadeInUp}
						className="inline-flex items-center space-x-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-2 text-sm font-medium mb-8"
					>
						<Zap className="h-4 w-4" />
						<span>Now Available: AI-Native Development Platform</span>
					</motion.div>
					{/* Main Heading */}
					<motion.h1
						variants={fadeInUp}
						className="text-4xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6"
					>
						The Future of
						<span className="bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
							{' '}
							AI Development
						</span>
					</motion.h1>
					{/* Subheading */}
					<motion.p
						variants={fadeInUp}
						className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed"
					>
						AIDE is the first truly autonomous development environment. Build, deploy, and scale
						applications with AI that thinks, codes, and ships for you.
					</motion.p>{' '}
					{/* CTA Buttons */}
					<motion.div
						variants={fadeInUp}
						className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12"
					>
						<DownloadButton
							variant="primary"
							size="lg"
							className="shadow-2xl hover:shadow-primary/25"
						/>
						<div className="flex space-x-4">
							<Link href={`${process.env.NEXT_PUBLIC_CONTROL_PANEL_URL}/signup`}>
								<Button
									variant="outline"
									size="lg"
									className="group bg-white/5 backdrop-blur-sm border-white/20 hover:bg-white/10"
								>
									<MessageSquare className="mr-2 h-4 w-4" />
									Try Web Version
									<ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
								</Button>
							</Link>
							<Button variant="ghost" size="lg" className="group text-white/80 hover:text-white">
								<Github className="mr-2 h-4 w-4" />
								View on GitHub
							</Button>
						</div>
					</motion.div>
					{/* Feature Pills */}
					<motion.div
						variants={fadeInUp}
						className="flex flex-wrap items-center justify-center gap-4 mb-16"
					>
						{[
							{ icon: Brain, text: 'AI-Powered Coding' },
							{ icon: Code2, text: 'VS Code Integration' },
							{ icon: Rocket, text: 'One-Click Deploy' },
							{ icon: Zap, text: 'Real-time Collaboration' },
						].map((feature, index) => (
							<div
								key={index}
								className="flex items-center space-x-2 bg-card border border-border rounded-full px-4 py-2 text-sm"
							>
								<feature.icon className="h-4 w-4 text-primary" />
								<span className="text-muted-foreground">{feature.text}</span>
							</div>
						))}
					</motion.div>
					{/* Hero Visual */}
					<motion.div variants={fadeInUp} className="relative">
						<div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
							<div className="bg-muted p-4 border-b border-border flex items-center space-x-3">
								<div className="flex space-x-2">
									<div className="w-3 h-3 bg-red-500 rounded-full"></div>
									<div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
									<div className="w-3 h-3 bg-green-500 rounded-full"></div>
								</div>
								<div className="text-sm text-muted-foreground">AIDE Terminal</div>
							</div>
							<div className="p-6 text-left">
								<div className="font-mono text-sm space-y-2">
									<div className="text-green-400">$ aide create next-app my-project</div>
									<div className="text-muted-foreground">✨ Analyzing requirements...</div>
									<div className="text-muted-foreground">
										🤖 AI generating optimized Next.js structure...
									</div>
									<div className="text-muted-foreground">📦 Installing dependencies...</div>
									<div className="text-muted-foreground">🚀 Setting up deployment pipeline...</div>
									<div className="text-green-400">✅ Project created successfully!</div>
									<div className="text-blue-400">🌐 Live at: https://my-project.aide.dev</div>
								</div>
							</div>
						</div>
					</motion.div>
				</motion.div>
			</div>
		</section>
	);
}
