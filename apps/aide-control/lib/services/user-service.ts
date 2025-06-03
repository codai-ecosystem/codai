import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, ServiceConfig, ServiceType } from '../types';
import { APIClient } from '../api-client';

export class UserService {
  private static instance: UserService;
  private apiClient: APIClient;

  private constructor() {
    // Private constructor to enforce singleton pattern
    this.apiClient = APIClient.getInstance();
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Create a new user profile
   */
  public async createUserProfile(profile: UserProfile): Promise<void> {
    try {
      await setDoc(doc(db, 'users', profile.userId), {
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  /**
   * Get a user profile by ID
   */
  public async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Try to use the API client first (for admin users accessing other users)
      try {
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid !== userId) {
          // If the current user is requesting another user's profile, use the API
          const user = await this.apiClient.getUser(userId);
          return user;
        }
      } catch (apiError) {
        // If API call fails, fallback to direct Firestore access
        console.warn("API call failed, falling back to Firestore:", apiError);
      }

      // Direct Firestore access (for users accessing their own profile)
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Update a user profile
   */
  public async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      // Try to use the API client first (better for tracking changes and validations)
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          // If updating their own profile or if they're an admin
          await this.apiClient.updateUser(userId, updates);
          return;
        }
      } catch (apiError) {
        // If API call fails, fallback to direct Firestore access
        console.warn("API call failed, falling back to Firestore:", apiError);
      }

      // Direct Firestore access fallback
      await setDoc(
        doc(db, 'users', userId),
        {
          ...updates,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get user service configurations
   */
  public async getUserServiceConfigs(userId: string): Promise<Record<ServiceType, ServiceConfig[]>> {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }
      return userProfile.serviceConfigs || {} as Record<ServiceType, ServiceConfig[]>;
    } catch (error) {
      console.error('Error fetching user service configs:', error);
      throw error;
    }
  }

  /**
   * Update user service configuration
   */
  public async updateServiceConfig(
    userId: string,
    serviceType: ServiceType,
    providerId: string,
    config: Partial<ServiceConfig>
  ): Promise<void> {
    try {
      await this.apiClient.updateServiceConfig(userId, serviceType, providerId, config);
    } catch (error) {
      console.error('Error updating service config:', error);
      throw error;
    }
  }

  /**
   * Add user service configuration
   */
  public async addServiceConfig(
    userId: string,
    config: ServiceConfig
  ): Promise<void> {
    try {
      await this.apiClient.addServiceConfig(userId, config);
    } catch (error) {
      console.error('Error adding service config:', error);
      throw error;
    }
  }

  /**
   * Delete user service configuration
   */
  public async deleteServiceConfig(
    userId: string,
    serviceType: ServiceType,
    providerId: string
  ): Promise<void> {
    try {
      await this.apiClient.deleteServiceConfig(userId, serviceType, providerId);
    } catch (error) {
      console.error('Error deleting service config:', error);
      throw error;
    }
  }

  /**
   * Get all user profiles (admin only)
   */
  public async getAllUserProfiles(): Promise<UserProfile[]> {
    try {
      // Try API client first for better security and validation
      try {
        return await this.apiClient.getUsers();
      } catch (apiError) {
        console.warn("API call failed, falling back to Firestore:", apiError);
      }

      // Fallback to direct Firestore access
      const usersSnapshot = await getDocs(collection(db, 'users'));
      return usersSnapshot.docs.map((doc) => doc.data() as UserProfile);
    } catch (error) {
      console.error('Error fetching all user profiles:', error);
      throw error;
    }
  }

  /**
   * Get user profiles by role (admin only)
   */
  public async getUserProfilesByRole(role: 'admin' | 'user'): Promise<UserProfile[]> {
    try {
      const usersQuery = query(collection(db, 'users'), where('role', '==', role));
      const usersSnapshot = await getDocs(usersQuery);
      return usersSnapshot.docs.map((doc) => doc.data() as UserProfile);
    } catch (error) {
      console.error(`Error fetching ${role} profiles:`, error);
      throw error;
    }
  }
}
