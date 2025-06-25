/**
 * Mock file for firebase-admin/firestore to make the build work
 */

export function getFirestore() {
	console.log('Firebase Admin Firestore Mock: getFirestore called');

	return {
		collection: (collectionName: string) => {
			console.log(`Firebase Admin Firestore Mock: accessing collection "${collectionName}"`);
			return {
				doc: (docId: string) => {
					console.log(
						`Firebase Admin Firestore Mock: accessing document "${docId}" in collection "${collectionName}"`
					);
					return {
						get: async () => {
							console.log(
								`Firebase Admin Firestore Mock: getting document "${docId}" from collection "${collectionName}"`
							);
							return {
								exists: true,
								data: () => ({ id: docId, mockData: true }),
								id: docId,
							};
						},
						set: async (data: any) => {
							console.log(
								`Firebase Admin Firestore Mock: setting document "${docId}" in collection "${collectionName}" with data`,
								data
							);
							return true;
						},
						update: async (data: any) => {
							console.log(
								`Firebase Admin Firestore Mock: updating document "${docId}" in collection "${collectionName}" with data`,
								data
							);
							return true;
						},
						delete: async () => {
							console.log(
								`Firebase Admin Firestore Mock: deleting document "${docId}" from collection "${collectionName}"`
							);
							return true;
						},
					};
				},
				where: () => ({
					get: async () => ({
						empty: false,
						docs: [
							{
								id: 'mock-doc-id',
								data: () => ({ mockData: true }),
								exists: true,
							},
						],
					}),
				}),
				add: async (data: any) => {
					console.log(
						`Firebase Admin Firestore Mock: adding document to collection "${collectionName}" with data`,
						data
					);
					return {
						id: 'new-mock-doc-id',
					};
				},
			};
		},
		batch: () => ({
			set: () => {},
			update: () => {},
			delete: () => {},
			commit: async () => Promise.resolve(),
		}),
		runTransaction: async (fn: Function) => {
			const mockTransaction = {
				get: async () => ({
					exists: true,
					data: () => ({ mockData: true }),
					id: 'mock-doc-id',
				}),
				set: () => {},
				update: () => {},
				delete: () => {},
			};
			return fn(mockTransaction);
		},
	};
}
