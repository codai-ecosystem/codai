// Firebase configuration for AIDE Control Panel
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// For server-side Firebase Admin SDK
let admin: any;
try {
  admin = require('firebase-admin');
} catch (e) {
  console.warn('Firebase Admin SDK not available, using mock');
  admin = {
    apps: [],
    initializeApp: () => { },
    credential: {
      cert: () => ({
        projectId: 'mock-project-id',
        clientEmail: 'mock@example.com',
        privateKey: 'mock-key'
      })
    },
    firestore: () => ({
      collection: () => ({
        doc: () => ({
          get: () => Promise.resolve({ exists: false, data: () => ({}) }),
          set: () => Promise.resolve(),
          update: () => Promise.resolve(),
          delete: () => Promise.resolve()
        }),
        add: () => Promise.resolve({ id: 'mock-id' }),
        where: () => ({
          get: () => Promise.resolve({ empty: true, docs: [] }),
          limit: () => ({
            get: () => Promise.resolve({ empty: true, docs: [] })
          }),
          orderBy: () => ({
            get: () => Promise.resolve({ empty: true, docs: [] }),
            limit: () => ({
              get: () => Promise.resolve({ empty: true, docs: [] })
            })
          })
        }),
        get: () => Promise.resolve({ docs: [] }),
        count: () => ({ get: () => Promise.resolve({ data: () => ({ count: 0 }) }) })
      }),
      collectionGroup: () => ({
        where: () => ({
          get: () => Promise.resolve({ docs: [] })
        })
      }),
      FieldValue: {
        increment: () => 0,
        serverTimestamp: () => new Date()
      }
    })
  };
}

// Your Firebase configuration
// This will be replaced with environment variables in production
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:demo',
};

// Initialize Firebase for client-side
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = null; // Mock for now

// Initialize Firebase Admin for server-side (API routes)
const getAdminApp = () => {
  if (admin.apps.length === 0) {
    if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
      try {
        const serviceAccount = JSON.parse(
          Buffer.from(process.env.FIREBASE_ADMIN_CREDENTIALS, 'base64').toString()
        );

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
        });
      } catch (error) {
        console.error('Error initializing Firebase Admin:', error);
        throw new Error('Failed to initialize Firebase Admin');
      }
    } else {
      console.warn('FIREBASE_ADMIN_CREDENTIALS not found, using client credentials for admin');
      admin.initializeApp(firebaseConfig);
    }
  }

  return admin;
};

export { app, auth, db, getAdminApp };
