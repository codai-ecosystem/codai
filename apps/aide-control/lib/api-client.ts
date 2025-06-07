import { ServiceConfig, ServiceType, UsageRecord, BillingPlan, UserProfile } from './types';
import { auth } from './firebase';

/**
 * API client for interacting with the backend services
 */
export class APIClient {
  private static instance: APIClient;
  private baseUrl: string;

  private constructor() {
    // Use current origin for client-side or a default for server-side
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  public static getInstance(): APIClient {
    if (!APIClient.instance) {
      APIClient.instance = new APIClient();
    }
    return APIClient.instance;
  }

  /**
   * Get the current authentication token
   */
  private async getAuthToken(): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User is not authenticated');
    }

    try {
      // Firebase Auth's User.getIdToken() method
      const token = await currentUser.getIdToken(true);
      if (!token) {
        throw new Error('Failed to get authentication token');
      }
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw new Error('Failed to get authentication token');
    }
  }

  /**
   * Make an authenticated API call
   */
  private async fetchWithAuth(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<any> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
    }

    return await response.json();
  }

  // Generic HTTP methods

  /**
   * Make a GET request
   */
  public async get(endpoint: string): Promise<any> {
    return this.fetchWithAuth(endpoint, 'GET');
  }

  /**
   * Make a POST request
   */
  public async post(endpoint: string, body?: any): Promise<any> {
    return this.fetchWithAuth(endpoint, 'POST', body);
  }

  /**
   * Make a PUT request
   */
  public async put(endpoint: string, body?: any): Promise<any> {
    return this.fetchWithAuth(endpoint, 'PUT', body);
  }

  /**
   * Make a DELETE request
   */
  public async delete(endpoint: string): Promise<any> {
    return this.fetchWithAuth(endpoint, 'DELETE');
  }

  // Admin methods

  /**
   * Get dashboard statistics (admin only)
   */
  public async getDashboardStats(): Promise<any> {
    return this.fetchWithAuth('/api/admin/dashboard-stats');
  }

  // User management methods

  /**
   * Get all users (admin only)
   */
  public async getUsers(): Promise<UserProfile[]> {
    const data = await this.fetchWithAuth('/api/users');
    return data.users;
  }

  /**
   * Get a user by ID
   */
  public async getUser(userId: string): Promise<UserProfile> {
    const data = await this.fetchWithAuth(`/api/users/${userId}`);
    return data.user;
  }

  /**
   * Create a new user (admin only)
   */
  public async createUser(userData: { email: string; password: string; displayName?: string; role?: string }): Promise<UserProfile> {
    const data = await this.fetchWithAuth('/api/users', 'POST', userData);
    return data.user;
  }

  /**
   * Update a user (admin only or own user)
   */
  public async updateUser(userId: string, userData: Partial<UserProfile>): Promise<UserProfile> {
    const data = await this.fetchWithAuth(`/api/users/${userId}`, 'PUT', userData);
    return data.user;
  }

  /**
   * Delete a user (admin only)
   */
  public async deleteUser(userId: string): Promise<void> {
    await this.fetchWithAuth(`/api/users/${userId}`, 'DELETE');
  }

  // Service configuration methods

  /**
   * Get service configurations for a user
   */
  public async getServiceConfigs(userId: string): Promise<Record<ServiceType, ServiceConfig[]>> {
    const data = await this.fetchWithAuth(`/api/users/${userId}/services`);
    return data.services;
  }

  /**
   * Add a service configuration for a user
   */
  public async addServiceConfig(userId: string, config: ServiceConfig): Promise<ServiceConfig> {
    const data = await this.fetchWithAuth(`/api/users/${userId}/services`, 'POST', config);
    return data.serviceConfig;
  }

  /**
   * Update a service configuration for a user
   */
  public async updateServiceConfig(
    userId: string,
    serviceType: ServiceType,
    providerId: string,
    config: Partial<ServiceConfig>
  ): Promise<ServiceConfig> {
    const data = await this.fetchWithAuth(
      `/api/users/${userId}/services/${serviceType}/${providerId}`,
      'PUT',
      config
    );
    return data.serviceConfig;
  }

  /**
   * Delete a service configuration for a user
   */
  public async deleteServiceConfig(
    userId: string,
    serviceType: ServiceType,
    providerId: string
  ): Promise<void> {
    await this.fetchWithAuth(`/api/users/${userId}/services/${serviceType}/${providerId}`, 'DELETE');
  }

  /**
   * Get a specific service configuration for a user
   */
  public async getServiceConfig(
    userId: string,
    serviceType: ServiceType,
    providerId: string
  ): Promise<ServiceConfig> {
    const data = await this.fetchWithAuth(`/api/users/${userId}/services/${serviceType}/${providerId}`);
    return data.config;
  }

  // Usage methods

  /**
   * Get usage records for a user
   */
  public async getUserUsage(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageRecord[]> {
    let endpoint = `/api/users/${userId}/usage`;

    // Add date filters if provided
    const params = new URLSearchParams();
    if (startDate) {
      params.append('start', startDate.toISOString());
    }
    if (endDate) {
      params.append('end', endDate.toISOString());
    }

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    const data = await this.fetchWithAuth(endpoint);
    return data.usage;
  }

  /**
   * Record usage for a user
   */
  public async recordUsage(usageRecord: UsageRecord): Promise<void> {
    await this.fetchWithAuth('/api/usage', 'POST', usageRecord);
  }

  /**
   * Get all billing plans
   */
  public async getBillingPlans(): Promise<BillingPlan[]> {
    return this.fetchWithAuth('/billing/plans');
  }

  /**
   * Create a new billing plan
   */
  public async createBillingPlan(plan: BillingPlan): Promise<BillingPlan> {
    return this.fetchWithAuth('/billing/plans', 'POST', plan);
  }

  /**
   * Create a checkout session for a user to subscribe to a plan
   */
  public async createCheckoutSession(
    userId: string,
    planId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ url: string }> {
    return this.fetchWithAuth('/billing/checkout', 'POST', {
      userId,
      planId,
      successUrl,
      cancelUrl,
    });
  }

  /**
   * Create a billing portal session for a user to manage their subscription
   */
  public async createBillingPortalSession(
    userId: string,
    returnUrl: string
  ): Promise<{ url: string }> {
    return this.fetchWithAuth('/billing/portal', 'POST', {
      userId,
      returnUrl,
    });
  }
}
