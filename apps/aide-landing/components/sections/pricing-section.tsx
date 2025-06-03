'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from '@/lib/hooks/use-in-view';
import { Button } from '@/components/ui/button';
import { Check, Zap, Crown, Rocket, Star, ExternalLink } from 'lucide-react';

export function PricingSection() {
	const [ref, inView] = useInView({
		triggerOnce: true,
		threshold: 0.1,
	});

	const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
	const [isLoading, setIsLoading] = useState<string | null>(null);
	// Stripe Price IDs from environment variables
	const stripePriceIds = {
		professional: {
			monthly: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional_monthly',
			yearly: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID || 'price_professional_yearly',
		},
		enterprise: {
			monthly: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly',
			yearly: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly',
		}
	};

	const handleSubscribe = async (planName: string, priceId?: string) => {
		if (planName === 'Starter') {
			// Redirect to free signup
			window.open(`${process.env.NEXT_PUBLIC_CONTROL_PANEL_URL}/signup`, '_blank');
			return;
		}

		if (planName === 'Enterprise' && !priceId) {
			// Redirect to contact sales
			window.open('mailto:sales@aide.dev?subject=Enterprise%20Plan%20Inquiry', '_blank');
			return;
		}

		if (!priceId) return;

		setIsLoading(planName);

		try {
			// Create Stripe Checkout session
			const response = await fetch('/api/stripe/create-checkout-session', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					priceId,
					mode: 'subscription',
					successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
					cancelUrl: window.location.href,
				}),
			});

			const { sessionId, url } = await response.json();

			if (url) {
				window.location.href = url;
			}
		} catch (error) {
			console.error('Error creating checkout session:', error);
			// Fallback to control panel signup
			window.open(`${process.env.NEXT_PUBLIC_CONTROL_PANEL_URL}/signup?plan=${planName.toLowerCase()}`, '_blank');
		} finally {
			setIsLoading(null);
		}
	};

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

	const plans = [
		{
			name: 'Starter',
			icon: Zap,
			description: 'Perfect for individual developers and small projects',
			price: {
				monthly: 0,
				yearly: 0,
			},
			features: [
				'5,000 AI requests/month',
				'2 active projects',
				'Basic VS Code integration',
				'Community support',
				'Standard deployment',
				'1GB storage',
			],
			popular: false,
			cta: 'Start Free',
		}, {
			name: 'Professional',
			icon: Crown,
			description: 'For growing teams and production applications',
			price: {
				monthly: 29,
				yearly: 24,
			},
			priceId: {
				monthly: stripePriceIds.professional.monthly,
				yearly: stripePriceIds.professional.yearly,
			},
			features: [
				'50,000 AI requests/month',
				'Unlimited projects',
				'Advanced AI features',
				'Priority support',
				'Auto-scaling deployment',
				'100GB storage',
				'Team collaboration',
				'Custom integrations',
			],
			popular: true,
			cta: 'Start Trial',
		},
		{
			name: 'Enterprise',
			icon: Rocket,
			description: 'For large organizations with custom needs',
			price: {
				monthly: 99,
				yearly: 79,
			},
			priceId: {
				monthly: stripePriceIds.enterprise.monthly,
				yearly: stripePriceIds.enterprise.yearly,
			},
			features: [
				'Unlimited AI requests',
				'Unlimited projects',
				'Custom AI models',
				'24/7 dedicated support',
				'Multi-cloud deployment',
				'Unlimited storage',
				'Advanced security',
				'Custom integrations',
				'SLA guarantee',
				'On-premise option',
			],
			popular: false,
			cta: 'Contact Sales',
		},
	];

	return (
		<section id="pricing" className="py-24 bg-background">
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
						<Star className="h-4 w-4" />
						<span>Pricing Plans</span>
					</motion.div>

					<motion.h2
						variants={itemVariants}
						className="text-3xl sm:text-5xl font-bold text-foreground mb-6"
					>
						Choose your
						<span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
							{' '}perfect plan
						</span>
					</motion.h2>

					<motion.p
						variants={itemVariants}
						className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8"
					>
						Start building for free, then scale as you grow. All plans include core AI features
						and VS Code integration.
					</motion.p>

					{/* Billing Toggle */}
					<motion.div
						variants={itemVariants}
						className="inline-flex items-center bg-muted rounded-lg p-1"
					>
						<button
							onClick={() => setBillingPeriod('monthly')}
							className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${billingPeriod === 'monthly'
								? 'bg-background text-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground'
								}`}
						>
							Monthly
						</button>
						<button
							onClick={() => setBillingPeriod('yearly')}
							className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${billingPeriod === 'yearly'
								? 'bg-background text-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground'
								}`}
						>
							Yearly
							<span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
								Save 20%
							</span>
						</button>
					</motion.div>
				</motion.div>

				<motion.div
					variants={containerVariants}
					initial="hidden"
					animate={inView ? "visible" : "hidden"}
					className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto"
				>
					{plans.map((plan, index) => (
						<motion.div
							key={index}
							variants={itemVariants}
							className={`relative bg-card border rounded-3xl p-8 ${plan.popular
								? 'border-primary shadow-xl scale-105'
								: 'border-border hover:border-primary/50'
								} transition-all duration-300 hover:shadow-lg`}
						>
							{/* Popular Badge */}
							{plan.popular && (
								<div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
									<div className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-medium">
										Most Popular
									</div>
								</div>
							)}

							{/* Plan Header */}
							<div className="text-center mb-8">
								<div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-xl mb-4">
									<plan.icon className="h-6 w-6" />
								</div>
								<h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
								<p className="text-muted-foreground">{plan.description}</p>
							</div>

							{/* Pricing */}
							<div className="text-center mb-8">
								<div className="flex items-baseline justify-center">
									<span className="text-5xl font-bold text-foreground">
										${plan.price[billingPeriod]}
									</span>
									<span className="text-muted-foreground ml-2">
										/{billingPeriod === 'yearly' ? 'month' : 'month'}
									</span>
								</div>
								{billingPeriod === 'yearly' && plan.price.yearly > 0 && (
									<p className="text-sm text-muted-foreground mt-2">
										Billed annually (${plan.price.yearly * 12}/year)
									</p>
								)}
							</div>

							{/* Features */}
							<ul className="space-y-4 mb-8">
								{plan.features.map((feature, featureIndex) => (
									<li key={featureIndex} className="flex items-start space-x-3">
										<Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
										<span className="text-muted-foreground">{feature}</span>
									</li>
								))}
							</ul>							{/* CTA Button */}
							<Button
								onClick={() => handleSubscribe(
									plan.name,
									plan.priceId ? plan.priceId[billingPeriod] : undefined
								)}
								disabled={isLoading === plan.name}
								className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''
									}`}
								variant={plan.popular ? 'default' : 'outline'}
								size="lg"
							>
								{isLoading === plan.name ? (
									<>
										<motion.div
											className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
											animate={{ rotate: 360 }}
											transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
										/>
										Processing...
									</>
								) : (
									<>
										{plan.cta}
										{plan.name !== 'Starter' && (
											<ExternalLink className="w-4 h-4 ml-2" />
										)}
									</>
								)}
							</Button>
						</motion.div>
					))}
				</motion.div>

				{/* Enterprise Contact */}
				<motion.div
					variants={itemVariants}
					initial="hidden"
					animate={inView ? "visible" : "hidden"}
					className="text-center mt-16"
				>
					<div className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-blue-500/5 border border-primary/20 rounded-2xl p-8 max-w-4xl mx-auto">
						<h3 className="text-2xl font-bold text-foreground mb-3">
							Need a custom solution?
						</h3>
						<p className="text-muted-foreground mb-6">
							Get in touch with our sales team to discuss enterprise features,
							custom deployments, and volume pricing.
						</p>
						<div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
							<Button size="lg">
								Schedule a Demo
							</Button>
							<Button variant="outline" size="lg">
								Contact Sales
							</Button>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
