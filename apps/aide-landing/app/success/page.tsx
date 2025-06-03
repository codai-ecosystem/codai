'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function SuccessPageContent() {
	const searchParams = useSearchParams();
	const sessionId = searchParams.get('session_id');
	const [session, setSession] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (sessionId) {
			// Verify the session with your backend
			fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
				.then(response => response.json())
				.then(data => {
					setSession(data);
					setLoading(false);
				})
				.catch(error => {
					console.error('Error verifying session:', error);
					setLoading(false);
				});
		} else {
			setLoading(false);
		}
	}, [sessionId]);

	const fadeInUp = {
		initial: { opacity: 0, y: 60 },
		animate: { opacity: 1, y: 0 },
		transition: { duration: 0.6 }
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<motion.div
					className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
					animate={{ rotate: 360 }}
					transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
				/>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4">
			<motion.div
				variants={fadeInUp}
				initial="initial"
				animate="animate"
				className="max-w-2xl mx-auto text-center"
			>
				{/* Success Icon */}
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
					className="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-600 rounded-full mb-8"
				>
					<CheckCircle className="w-10 h-10" />
				</motion.div>

				{/* Heading */}
				<motion.h1
					variants={fadeInUp}
					className="text-4xl sm:text-5xl font-bold text-foreground mb-6"
				>
					Welcome to AIDE! 🎉
				</motion.h1>

				{/* Description */}
				<motion.p
					variants={fadeInUp}
					className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto"
				>
					Your subscription is now active. You can now download AIDE and start building with AI superpowers.
				</motion.p>

				{/* Session Info */}
				{session && (
					<motion.div
						variants={fadeInUp}
						className="bg-card border border-border rounded-xl p-6 mb-8 text-left max-w-md mx-auto"
					>
						<h3 className="text-lg font-semibold text-foreground mb-4">Subscription Details</h3>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Plan:</span>
								<span className="text-foreground font-medium">{session.plan || 'Professional'}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Billing:</span>
								<span className="text-foreground font-medium">{session.billing || 'Monthly'}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Amount:</span>
								<span className="text-foreground font-medium">${session.amount || '29'}</span>
							</div>
						</div>
					</motion.div>
				)}

				{/* Action Buttons */}
				<motion.div
					variants={fadeInUp}
					className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8"
				>
					<Button size="lg" className="group w-full sm:w-auto">
						<Download className="mr-2 h-5 w-5" />
						Download AIDE
						<ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
					</Button>

					<Link href={`${process.env.NEXT_PUBLIC_CONTROL_PANEL_URL}/dashboard`}>
						<Button variant="outline" size="lg" className="group w-full sm:w-auto">
							<ExternalLink className="mr-2 h-4 w-4" />
							Open Dashboard
						</Button>
					</Link>
				</motion.div>

				{/* Next Steps */}
				<motion.div
					variants={fadeInUp}
					className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-left"
				>
					<h3 className="text-lg font-semibold text-foreground mb-4">Next Steps</h3>
					<ol className="space-y-3 text-muted-foreground">
						<li className="flex items-start space-x-3">
							<span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm flex items-center justify-center font-medium">1</span>
							<span>Download and install AIDE for your operating system</span>
						</li>
						<li className="flex items-start space-x-3">
							<span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm flex items-center justify-center font-medium">2</span>
							<span>Sign in with the same email you used for this purchase</span>
						</li>
						<li className="flex items-start space-x-3">
							<span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm flex items-center justify-center font-medium">3</span>
							<span>Start your first AI-powered project</span>
						</li>
					</ol>
				</motion.div>

				{/* Support */}
				<motion.p
					variants={fadeInUp}
					className="text-sm text-muted-foreground mt-8"
				>
					Need help getting started?{' '}
					<a
						href="mailto:support@aide.dev"
						className="text-primary hover:underline"
					>
						Contact our support team
					</a>
					{' '}or check out our{' '}
					<a
						href="/docs"
						className="text-primary hover:underline"
					>
						documentation
					</a>				</motion.p>
			</motion.div>
		</div>
	);
}

export default function SuccessPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
				<div className="text-lg">Loading...</div>
			</div>
		}>
			<SuccessPageContent />
		</Suspense>
	);
}
