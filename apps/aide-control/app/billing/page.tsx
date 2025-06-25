'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'next/navigation';
import { BillingPlan } from '../../lib/types';
import Link from 'next/link';

export default function BillingPage() {
	const { user, loading } = useAuth();
	const router = useRouter();
	const [plans, setPlans] = useState<BillingPlan[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Redirect to login if not authenticated
		if (!loading && !user) {
			router.push('/login');
		}

		// Fetch billing plans
		const fetchPlans = async () => {
			if (user) {
				try {
					setIsLoading(true);
					// In a real implementation, we would fetch from the API
					// For now, we'll use mock data
					setPlans([
						{
							id: 'plan_basic',
							name: 'Basic Plan',
							description: 'Basic access to AIDE platform services',
							price: 999, // $9.99
							interval: 'month',
							features: [
								{
									serviceType: 'llm',
									providerId: 'openai',
									limit: 100000, // 100k tokens
									costMultiplier: 1,
								},
								{
									serviceType: 'embedding',
									providerId: 'openai',
									limit: 1000000, // 1M tokens
									costMultiplier: 1,
								},
							],
						},
						{
							id: 'plan_pro',
							name: 'Professional Plan',
							description: 'Enhanced access to AIDE platform services',
							price: 4999, // $49.99
							interval: 'month',
							features: [
								{
									serviceType: 'llm',
									providerId: 'openai',
									limit: 1000000, // 1M tokens
									costMultiplier: 0.8, // 20% discount
								},
								{
									serviceType: 'embedding',
									providerId: 'openai',
									limit: 10000000, // 10M tokens
									costMultiplier: 0.8, // 20% discount
								},
								{
									serviceType: 'llm',
									providerId: 'anthropic',
									limit: 500000, // 500k tokens
									costMultiplier: 0.9, // 10% discount
								},
							],
						},
						{
							id: 'plan_enterprise',
							name: 'Enterprise Plan',
							description: 'Full access to all AIDE platform services',
							price: 19999, // $199.99
							interval: 'month',
							features: [
								{
									serviceType: 'llm',
									providerId: 'openai',
									limit: 10000000, // 10M tokens
									costMultiplier: 0.6, // 40% discount
								},
								{
									serviceType: 'embedding',
									providerId: 'openai',
									limit: 100000000, // 100M tokens
									costMultiplier: 0.6, // 40% discount
								},
								{
									serviceType: 'llm',
									providerId: 'anthropic',
									limit: 5000000, // 5M tokens
									costMultiplier: 0.7, // 30% discount
								},
							],
						},
					]);
					setIsLoading(false);
				} catch (error) {
					console.error('Error fetching billing plans:', error);
					setIsLoading(false);
				}
			}
		};

		if (user) {
			fetchPlans();
		}
	}, [user, loading, router]);

	if (loading || isLoading) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center p-24">
				<div className="text-2xl">Loading...</div>
			</main>
		);
	}

	if (!user) {
		return null; // Will redirect to login
	}

	const formatPrice = (price: number): string => {
		const dollars = Math.floor(price / 100);
		const cents = price % 100;
		return `$${dollars}.${cents.toString().padStart(2, '0')}`;
	};

	return (
		<main className="flex min-h-screen flex-col p-8">
			<header className="border-b pb-4 mb-8">
				<div className="flex justify-between items-center">
					<div>
						<Link href="/" className="text-blue-600 hover:underline mb-2 inline-block">
							← Back to Dashboard
						</Link>
						<h1 className="text-4xl font-bold">Billing Plans</h1>
					</div>
					<button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
						Create New Plan
					</button>
				</div>
			</header>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				{plans.map(plan => (
					<div key={plan.id} className="border rounded-lg shadow-sm overflow-hidden">
						<div className="bg-gray-50 dark:bg-gray-800 p-6 border-b">
							<h2 className="text-2xl font-bold">{plan.name}</h2>
							<p className="text-3xl font-bold mt-2">
								{formatPrice(plan.price)}{' '}
								<span className="text-sm text-gray-500">/ {plan.interval}</span>
							</p>
							<p className="mt-2 text-gray-600 dark:text-gray-300">{plan.description}</p>
						</div>
						<div className="p-6">
							<h3 className="text-xl font-semibold mb-4">Features</h3>
							<ul className="space-y-3">
								{plan.features.map((feature, index) => (
									<li key={index} className="flex items-start">
										<svg
											className="h-6 w-6 text-green-500 mr-2"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M5 13l4 4L19 7"
											/>
										</svg>
										<div>
											<span className="font-medium">
												{feature.serviceType.toUpperCase()} ({feature.providerId}):
											</span>
											{feature.limit && (
												<div className="text-sm text-gray-600 dark:text-gray-300">
													{feature.limit.toLocaleString()} tokens
												</div>
											)}
											{feature.costMultiplier && feature.costMultiplier < 1 && (
												<div className="text-sm text-green-600 dark:text-green-400">
													{Math.round((1 - feature.costMultiplier) * 100)}% discount
												</div>
											)}
										</div>
									</li>
								))}
							</ul>
							<div className="mt-6 flex space-x-2">
								<button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1">
									Edit
								</button>
								<button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
									Delete
								</button>
							</div>
						</div>
					</div>
				))}
			</div>
		</main>
	);
}
