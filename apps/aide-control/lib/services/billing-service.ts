import Stripe from 'stripe';
import { BillingPlan, UsageRecord } from '../types';
import { APIClient } from '../api-client';

export class BillingService {
  private static instance: BillingService;
  private stripe: Stripe;
  private plans: Map<string, BillingPlan> = new Map();
  private apiClient: APIClient;

  private constructor() {
    // Initialize Stripe with the API key from environment variables
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-04-10',
    });

    // Get API client for backend communication
    this.apiClient = APIClient.getInstance();
  }

  public static getInstance(): BillingService {
    if (!BillingService.instance) {
      BillingService.instance = new BillingService();
    }
    return BillingService.instance;
  }

  /**
   * Create a new Stripe customer
   */
  public async createCustomer(email: string, name?: string): Promise<string> {
    const customer = await this.stripe.customers.create({
      email,
      name,
    });

    return customer.id;
  }

  /**
   * Create a checkout session for a subscription
   */
  public async createCheckoutSession(
    customerId: string,
    planId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: planId, // Stripe price ID
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return session.url || '';
  }

  /**
   * Cancel a subscription
   */
  public async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.cancel(subscriptionId);
  }

  /**
   * Calculate usage costs
   */
  public calculateUsageCost(usageRecord: UsageRecord, plan?: BillingPlan): number {
    // Get the plan details if provided
    if (!plan && usageRecord.userId) {
      // In a real system, we'd fetch the user's plan from the database
      // For now, we'll use a default cost
    }

    // Default cost calculations (could be more sophisticated based on plan)
    let cost = 0;
    const { inputTokens = 0, outputTokens = 0 } = usageRecord.requestDetails;

    // Example cost calculation: $0.01 per 1K input tokens, $0.02 per 1K output tokens
    cost += (inputTokens / 1000) * 1; // $0.01 per 1K tokens in cents
    cost += (outputTokens / 1000) * 2; // $0.02 per 1K tokens in cents

    return Math.round(cost); // Return in cents
  }
  /**
 * Get all billing plans
 */
  public async getBillingPlans(): Promise<BillingPlan[]> {
    try {
      // Use getBillingPlans method when implemented in APIClient
      // For now, return an empty array
      return [];
    } catch (error) {
      console.error('Error getting billing plans:', error);
      throw new Error('Failed to retrieve billing plans');
    }
  }

  /**
   * Create a new billing plan (admin only)
   */
  public async createBillingPlan(plan: Omit<BillingPlan, 'id'>): Promise<BillingPlan> {
    try {
      // 1. Create Stripe product & price
      const product = await this.stripe.products.create({
        name: plan.name,
        description: plan.description,
      });

      const price = await this.stripe.prices.create({
        product: product.id,
        unit_amount: plan.price,
        currency: 'usd',
        recurring: {
          interval: plan.interval,
        },
      });      // 2. Store in our database with Stripe IDs
      const newPlan: BillingPlan = {
        id: `plan_${Date.now()}`, // Generate a temporary ID
        ...plan,
        stripeProductId: product.id,
        stripePriceId: price.id,
      };

      // TODO: Implement proper API call when available
      // For now, simulate a successful response
      const data = { plan: newPlan };
      return data.plan;
    } catch (error) {
      console.error('Error creating billing plan:', error);
      throw new Error('Failed to create billing plan');
    }
  }
  /**
 * Delete a billing plan (admin only)
 */
  public async deleteBillingPlan(planId: string): Promise<void> {
    try {
      // TODO: Implement proper API call when available
      // For now, simulate fetching plan data
      const stripeProductId = 'prod_123';
      const stripePriceId = 'price_123';

      // 2. Archive the Stripe price and product
      if (stripePriceId) {
        await this.stripe.prices.update(stripePriceId, { active: false });
      }

      if (stripeProductId) {
        await this.stripe.products.update(stripeProductId, { active: false });
      }

      // 3. Delete from our database
      // TODO: Implement proper API call when available
    } catch (error) {
      console.error('Error deleting billing plan:', error);
      throw new Error('Failed to delete billing plan');
    }
  }

  /**
   * Get a user's billing information
   */
  public async getUserBilling(userId: string): Promise<{
    plan: BillingPlan | null;
    subscription: any;
    usage: number;
    limit: number;
    invoices: any[];
  }> {
    try {
      // TODO: Implement proper API call when available
      // For now, return mock data
      return {
        plan: null,
        subscription: null,
        usage: 0,
        limit: 100,
        invoices: []
      };
    } catch (error) {
      console.error('Error getting user billing:', error);
      throw new Error('Failed to retrieve user billing information');
    }
  }
}
