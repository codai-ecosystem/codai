'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from '@/lib/hooks/use-in-view';
import {
	Brain,
	Code2,
	Rocket,
	Shield,
	Zap,
	GitBranch,
	Database,
	Cloud,
	Users,
	Bot,
	Layers,
	Target
} from 'lucide-react';

export function FeaturesSection() {
	const [ref, inView] = useInView({
		triggerOnce: true,
		threshold: 0.1,
	});

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.2,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				duration: 0.6,
			},
		},
	};

	const features = [
		{
			icon: Brain,
			title: 'Autonomous AI Agent',
			description: 'AI that understands context, writes code, fixes bugs, and makes architectural decisions independently.',
			category: 'AI-Powered',
		},
		{
			icon: Code2,
			title: 'VS Code Integration',
			description: 'Seamless integration with your favorite editor. Work in familiar environment with AI superpowers.',
			category: 'Development',
		},
		{
			icon: Rocket,
			title: 'One-Click Deployment',
			description: 'Deploy to production with a single command. Automatic scaling, monitoring, and rollbacks included.',
			category: 'DevOps',
		},
		{
			icon: Database,
			title: 'Smart Database Management',
			description: 'AI-optimized database schemas, migrations, and queries. Supports PostgreSQL, MongoDB, and more.',
			category: 'Data',
		},
		{
			icon: GitBranch,
			title: 'Intelligent Version Control',
			description: 'AI-powered git workflows with automatic branch management, conflict resolution, and code reviews.',
			category: 'Collaboration',
		},
		{
			icon: Shield,
			title: 'Built-in Security',
			description: 'Automated security scanning, vulnerability detection, and compliance checks in your development workflow.',
			category: 'Security',
		},
		{
			icon: Cloud,
			title: 'Multi-Cloud Support',
			description: 'Deploy to AWS, Google Cloud, Azure, or any cloud provider with optimized configurations.',
			category: 'Infrastructure',
		},
		{
			icon: Users,
			title: 'Team Collaboration',
			description: 'Real-time collaboration with shared AI context, live coding sessions, and team knowledge bases.',
			category: 'Collaboration',
		},
		{
			icon: Zap,
			title: 'Lightning Fast',
			description: 'Optimized development workflows that are 10x faster than traditional development processes.',
			category: 'Performance',
		},
	];

	return (
		<section id="features" className="py-24 bg-muted/30">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<motion.div
					ref={ref}
					variants={containerVariants}
					initial="hidden"
					animate={inView ? "visible" : "hidden"}
					className="text-center mb-16"
				>
					<motion.div
						variants={itemVariants}
						className="inline-flex items-center space-x-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-2 text-sm font-medium mb-6"
					>
						<Target className="h-4 w-4" />
						<span>Core Features</span>
					</motion.div>

					<motion.h2
						variants={itemVariants}
						className="text-3xl sm:text-5xl font-bold text-foreground mb-6"
					>
						Everything you need to
						<span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
							{' '}build faster
						</span>
					</motion.h2>

					<motion.p
						variants={itemVariants}
						className="text-xl text-muted-foreground max-w-3xl mx-auto"
					>
						AIDE combines the power of AI with modern development tools to create
						the most advanced development environment ever built.
					</motion.p>
				</motion.div>

				<motion.div
					variants={containerVariants}
					initial="hidden"
					animate={inView ? "visible" : "hidden"}
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
				>
					{features.map((feature, index) => (
						<motion.div
							key={index}
							variants={itemVariants}
							className="group relative bg-card border border-border rounded-2xl p-8 hover:shadow-lg hover:border-primary/20 transition-all duration-300"
						>
							{/* Category Badge */}
							<div className="absolute top-6 right-6">
								<span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
									{feature.category}
								</span>
							</div>

							{/* Icon */}
							<div className="mb-6">
								<div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
									<feature.icon className="h-6 w-6" />
								</div>
							</div>

							{/* Content */}
							<h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
								{feature.title}
							</h3>
							<p className="text-muted-foreground leading-relaxed">
								{feature.description}
							</p>

							{/* Hover Effect */}
							<div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
						</motion.div>
					))}
				</motion.div>

				{/* Bottom CTA */}
				<motion.div
					variants={itemVariants}
					initial="hidden"
					animate={inView ? "visible" : "hidden"}
					className="text-center mt-16"
				>
					<div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 border border-primary/20 rounded-2xl p-8">
						<Bot className="h-12 w-12 text-primary mx-auto mb-4" />
						<h3 className="text-2xl font-bold text-foreground mb-3">
							Ready to experience the future?
						</h3>
						<p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
							Join thousands of developers who are already building with AI.
							Start your free trial today and see the difference.
						</p>
						<div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
							<Layers className="h-4 w-4" />
							<span>No credit card required</span>
							<span>•</span>
							<span>Free 14-day trial</span>
							<span>•</span>
							<span>Cancel anytime</span>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
