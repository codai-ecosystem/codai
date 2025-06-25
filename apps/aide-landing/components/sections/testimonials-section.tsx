'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from '@/lib/hooks/use-in-view';
import { Star, Quote } from 'lucide-react';

export function TestimonialsSection() {
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

	const testimonials = [
		{
			content:
				"AIDE has completely transformed how our team develops software. The AI agent is like having a senior developer working alongside you 24/7. We've reduced our development time by 60% while improving code quality.",
			author: 'Sarah Chen',
			role: 'Engineering Director',
			company: 'TechFlow',
			avatar:
				'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=faces&auto=format',
			rating: 5,
		},
		{
			content:
				'The VS Code integration is seamless, and the AI understands our codebase better than some of our junior developers. AIDE has become an essential part of our development workflow.',
			author: 'Marcus Rodriguez',
			role: 'Lead Developer',
			company: 'InnovaCorp',
			avatar:
				'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces&auto=format',
			rating: 5,
		},
		{
			content:
				"What impressed me most is how AIDE learns from our coding patterns and suggests optimizations. It's not just autocomplete - it's truly intelligent assistance that makes our entire team more productive.",
			author: 'Emily Thompson',
			role: 'Full-Stack Developer',
			company: 'StartupXYZ',
			avatar:
				'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces&auto=format',
			rating: 5,
		},
		{
			content:
				'The deployment automation is incredible. What used to take hours of manual configuration now happens with a single command. AIDE handles everything from infrastructure setup to monitoring.',
			author: 'David Kim',
			role: 'DevOps Engineer',
			company: 'ScaleHub',
			avatar:
				'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces&auto=format',
			rating: 5,
		},
		{
			content:
				'As a solo developer, AIDE gives me the capabilities of an entire development team. The AI handles the tedious tasks while I focus on the creative and strategic aspects of building products.',
			author: 'Lisa Park',
			role: 'Indie Developer',
			company: 'Creator Studio',
			avatar:
				'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces&auto=format',
			rating: 5,
		},
		{
			content:
				"The security features and code analysis have caught issues that we would have missed in manual reviews. AIDE doesn't just make us faster - it makes us better developers.",
			author: 'James Wilson',
			role: 'Security Engineer',
			company: 'SecureFlow',
			avatar:
				'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces&auto=format',
			rating: 5,
		},
	];

	return (
		<section id="testimonials" className="py-24 bg-muted/30">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<motion.div
					ref={ref}
					variants={containerVariants}
					initial="hidden"
					animate={inView ? 'visible' : 'hidden'}
					className="text-center mb-16"
				>
					<motion.div
						variants={itemVariants}
						className="inline-flex items-center space-x-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-2 text-sm font-medium mb-6"
					>
						<Quote className="h-4 w-4" />
						<span>What Developers Say</span>
					</motion.div>

					<motion.h2
						variants={itemVariants}
						className="text-3xl sm:text-5xl font-bold text-foreground mb-6"
					>
						Loved by developers
						<span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
							{' '}
							worldwide
						</span>
					</motion.h2>

					<motion.p
						variants={itemVariants}
						className="text-xl text-muted-foreground max-w-3xl mx-auto"
					>
						Join thousands of developers who have already transformed their development workflow
						with AIDE's AI-powered platform.
					</motion.p>
				</motion.div>

				<motion.div
					variants={containerVariants}
					initial="hidden"
					animate={inView ? 'visible' : 'hidden'}
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
				>
					{testimonials.map((testimonial, index) => (
						<motion.div
							key={index}
							variants={itemVariants}
							className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg hover:border-primary/20 transition-all duration-300"
						>
							{/* Rating */}
							<div className="flex items-center space-x-1 mb-6">
								{[...Array(testimonial.rating)].map((_, i) => (
									<Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
								))}
							</div>

							{/* Quote */}
							<blockquote className="text-muted-foreground leading-relaxed mb-6">
								"{testimonial.content}"
							</blockquote>

							{/* Author */}
							<div className="flex items-center space-x-4">
								<img
									src={testimonial.avatar}
									alt={testimonial.author}
									className="w-12 h-12 rounded-full object-cover"
								/>
								<div>
									<div className="font-semibold text-foreground">{testimonial.author}</div>
									<div className="text-sm text-muted-foreground">{testimonial.role}</div>
									<div className="text-sm text-primary">{testimonial.company}</div>
								</div>
							</div>
						</motion.div>
					))}
				</motion.div>

				{/* Stats Section */}
				<motion.div
					variants={itemVariants}
					initial="hidden"
					animate={inView ? 'visible' : 'hidden'}
					className="mt-20"
				>
					<div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 border border-primary/20 rounded-2xl p-8">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
							<div>
								<div className="text-3xl font-bold text-foreground mb-2">10K+</div>
								<div className="text-muted-foreground">Active Developers</div>
							</div>
							<div>
								<div className="text-3xl font-bold text-foreground mb-2">50M+</div>
								<div className="text-muted-foreground">Lines of Code Generated</div>
							</div>
							<div>
								<div className="text-3xl font-bold text-foreground mb-2">99.9%</div>
								<div className="text-muted-foreground">Uptime</div>
							</div>
							<div>
								<div className="text-3xl font-bold text-foreground mb-2">60%</div>
								<div className="text-muted-foreground">Faster Development</div>
							</div>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
