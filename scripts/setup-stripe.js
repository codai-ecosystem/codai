#!/usr/bin/env node

/**
 * Stripe Setup Script for AIDE
 * This script creates the necessary products and prices in Stripe
 */

const Stripe = require('stripe');

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setupStripeProducts() {
	try {
		console.log('🚀 Setting up AIDE Stripe products...\n');

		// Create Professional Plan Product
		const professionalProduct = await stripe.products.create({
			name: 'AIDE Professional',
			description: 'Advanced AI development tools for individual developers and small teams',
			metadata: {
				plan: 'professional',
				features: JSON.stringify([
					'Advanced AI Assistant',
					'Priority Support',
					'Custom Integrations',
					'Advanced Analytics',
					'Team Collaboration',
				]),
			},
		});

		// Create Professional Monthly Price
		const professionalMonthlyPrice = await stripe.prices.create({
			product: professionalProduct.id,
			unit_amount: 2900, // $29.00
			currency: 'usd',
			recurring: {
				interval: 'month',
			},
			nickname: 'Professional Monthly',
		});

		// Create Enterprise Product
		const enterpriseProduct = await stripe.products.create({
			name: 'AIDE Enterprise',
			description: 'Complete AI development platform for large teams and enterprises',
			metadata: {
				plan: 'enterprise',
				features: JSON.stringify([
					'Everything in Professional',
					'Unlimited Team Members',
					'Advanced Security',
					'Custom AI Models',
					'Dedicated Support',
					'SLA Guarantees',
					'On-premise Deployment',
				]),
			},
		});

		// Create Enterprise Monthly Price
		const enterpriseMonthlyPrice = await stripe.prices.create({
			product: enterpriseProduct.id,
			unit_amount: 9900, // $99.00
			currency: 'usd',
			recurring: {
				interval: 'month',
			},
			nickname: 'Enterprise Monthly',
		});

		console.log('✅ Products and prices created successfully!\n');

		console.log('📋 Update your environment variables with these price IDs:');
		console.log(`STRIPE_PROFESSIONAL_PRICE_ID=${professionalMonthlyPrice.id}`);
		console.log(`STRIPE_ENTERPRISE_PRICE_ID=${enterpriseMonthlyPrice.id}\n`);

		console.log('📋 Update pricing-section.tsx with these price IDs:');
		console.log(`Professional: ${professionalMonthlyPrice.id}`);
		console.log(`Enterprise: ${enterpriseMonthlyPrice.id}\n`);

		return {
			professionalPriceId: professionalMonthlyPrice.id,
			enterprisePriceId: enterpriseMonthlyPrice.id,
		};
	} catch (error) {
		console.error('❌ Error setting up Stripe products:', error.message);
		process.exit(1);
	}
}

// Run the setup if this file is executed directly
if (require.main === module) {
	if (!process.env.STRIPE_SECRET_KEY) {
		console.error('❌ Please set STRIPE_SECRET_KEY environment variable');
		process.exit(1);
	}

	setupStripeProducts();
}

module.exports = { setupStripeProducts };
