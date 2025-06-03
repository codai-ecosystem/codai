'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth, onAuthStateChanged, signInWithCustomToken } from './firebase-client';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  createUser: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); useEffect(() => {
    // Check for auth token on page load (for OAuth flow)
    const checkAuthToken = async () => {
      try {
        const response = await fetch('/api/auth/get-token');
        if (response.ok) {
          const { token } = await response.json();

          if (token) {
            // Sign in with custom token if available
            await signInWithCustomToken(token);
            // Auth state change will be caught by the listener below
          }
        }
      } catch (error) {
        console.error('Error checking auth token:', error);
      }
    };

    // Run once on mount
    checkAuthToken();

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };
  const createUser = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };
  const signInWithGoogle = async () => {
    try {
      const response = await fetch('/api/auth/oauth?provider=google');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate Google OAuth');
      }

      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signInWithGithub = async () => {
    try {
      const response = await fetch('/api/auth/oauth?provider=github');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate GitHub OAuth');
      }
      // Redirect to GitHub OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error signing in with GitHub:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signOut,
      createUser,
      signInWithGoogle,
      signInWithGithub
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
