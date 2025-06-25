// This file contains type declarations for missing node modules

declare module 'firebase/app' {
	export interface FirebaseApp {
		name: string;
		options: object;
	}

	export function initializeApp(options: object, name?: string): FirebaseApp;
	export function getApps(): FirebaseApp[];
}

declare module 'firebase/auth' {
	export interface User {
		uid: string;
		email: string | null;
		emailVerified: boolean;
		displayName: string | null;
		photoURL: string | null;
		phoneNumber: string | null;
		getIdToken(forceRefresh?: boolean): Promise<string>;
	}

	export interface Auth {
		app: any;
		currentUser: User | null;
	}

	export function getAuth(app?: any): Auth;
	export function signInWithEmailAndPassword(
		auth: Auth,
		email: string,
		password: string
	): Promise<any>;
	export function signOut(auth: Auth): Promise<void>;
	export function createUserWithEmailAndPassword(
		auth: Auth,
		email: string,
		password: string
	): Promise<any>;
	export function onAuthStateChanged(auth: Auth, callback: (user: User | null) => void): () => void;
}

declare module 'firebase/firestore' {
	export interface DocumentData {
		[key: string]: any;
	}

	export interface DocumentReference<T = DocumentData> {
		id: string;
	}

	export interface DocumentSnapshot<T = DocumentData> {
		id: string;
		exists(): boolean;
		data(): T | undefined;
	}

	export interface QuerySnapshot<T = DocumentData> {
		docs: QueryDocumentSnapshot<T>[];
	}

	export interface QueryDocumentSnapshot<T = DocumentData> extends DocumentSnapshot<T> {
		data(): T;
	}

	export function doc(firestore: any, path: string, ...pathSegments: string[]): DocumentReference;
	export function getDoc<T>(docRef: DocumentReference<T>): Promise<DocumentSnapshot<T>>;
	export function setDoc<T>(
		docRef: DocumentReference<T>,
		data: T,
		options?: { merge?: boolean }
	): Promise<void>;
	export function collection(firestore: any, path: string, ...pathSegments: string[]): any;
	export function query(collection: any, ...queryConstraints: any[]): any;
	export function where(field: string, opStr: string, value: any): any;
	export function getDocs<T>(query: any): Promise<QuerySnapshot<T>>;
	export function addDoc<T>(collection: any, data: T): Promise<DocumentReference<T>>;
}

declare module 'next/link' {
	import * as React from 'react';

	interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
		href: string;
		as?: string;
		replace?: boolean;
		scroll?: boolean;
		shallow?: boolean;
		passHref?: boolean;
		prefetch?: boolean;
	}

	const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;
	export default Link;
}

declare module 'next/navigation' {
	export interface Router {
		push(url: string): void;
		replace(url: string): void;
		back(): void;
		reload(): void;
		refresh(): void;
	}

	export function useRouter(): Router;
}

declare module 'next/server' {
	export interface NextRequest extends Request {
		cookies: any;
		headers: Headers;
		json: () => Promise<any>;
	}

	export interface NextResponse extends Response {
		cookies: any;
	}

	export interface NextConfig {
		reactStrictMode?: boolean;
		env?: Record<string, string>;
		experimental?: Record<string, any>;
		headers?: () => Promise<any>;
		rewrites?: () => Promise<any>;
	}

	export function NextResponse(body?: BodyInit | null, options?: ResponseInit): NextResponse;
	export namespace NextResponse {
		export function redirect(url: string | URL, status?: number): NextResponse;
		export function rewrite(url: string | URL, status?: number): NextResponse;
		export function next(options?: { rewrite?: string }): NextResponse;
		export function json(body: any, options?: ResponseInit): NextResponse;
	}
}

declare module 'firebase-admin' {
	export function initializeApp(options?: any, name?: string): any;
	export function getApps(): any[];
	export namespace credential {
		export function cert(certData: any): any;
	}
	export namespace auth {
		export function getAuth(): any;
	}
	export namespace firestore {
		export function getFirestore(): any;
		export class FieldValue {
			static increment(n: number): any;
		}
	}
}

// Augment process.env with our environment variables
declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NEXT_PUBLIC_FIREBASE_API_KEY: string;
			NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
			NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
			NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
			NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
			NEXT_PUBLIC_FIREBASE_APP_ID: string;
			FIREBASE_ADMIN_CREDENTIALS?: string;
			NEXT_PUBLIC_API_URL: string;
			STRIPE_SECRET_KEY: string;
			NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
			STRIPE_WEBHOOK_SECRET: string;
			OPENAI_API_KEY?: string;
			AZURE_OPENAI_API_KEY?: string;
			AZURE_OPENAI_ENDPOINT?: string;
			ANTHROPIC_API_KEY?: string;
		}
	}
}
