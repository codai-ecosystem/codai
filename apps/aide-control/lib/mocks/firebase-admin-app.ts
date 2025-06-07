/**
 * Mock file for firebase-admin/app to make the build work
 */
export function initializeApp(config: any) {
  console.log('Firebase Admin App Mock: initializeApp called with', config);
  return {
    name: 'mock-firebase-app',
    options: config,
  };
}

export function getApps() {
  console.log('Firebase Admin App Mock: getApps called');
  return [];
}

export function cert(credentials: any) {
  console.log('Firebase Admin App Mock: cert called with', credentials);
  return credentials;
}
