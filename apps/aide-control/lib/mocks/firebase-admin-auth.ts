/**
 * Mock file for firebase-admin/auth to make the build work
 */

export function getAuth() {
	console.log('Firebase Admin Auth Mock: getAuth called');
	return {
		verifyIdToken: async (token: string) => {
			console.log('Firebase Admin Auth Mock: verifyIdToken called with', token);
			return {
				uid: 'mock-uid',
				email: 'mock@example.com',
				role: 'user',
			};
		},
		getUserByEmail: async (email: string) => {
			console.log('Firebase Admin Auth Mock: getUserByEmail called with', email);
			return {
				uid: 'mock-uid',
				email,
				emailVerified: true,
			};
		},
		createUser: async (userData: any) => {
			console.log('Firebase Admin Auth Mock: createUser called with', userData);
			return {
				uid: 'mock-uid',
				...userData,
			};
		},
	};
}
