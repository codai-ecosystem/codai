import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// LogAI Integration Configuration
const logaiConfig = {
	apiUrl: process.env.LOGAI_API_URL || 'https://logai.codai.ro',
	clientId: process.env.LOGAI_CLIENT_ID || 'codai-web-client',
	clientSecret: process.env.LOGAI_CLIENT_SECRET,
};

export const authConfig = {
	pages: {
		signIn: '/auth/signin',
		signOut: '/auth/signout',
		error: '/auth/error',
	},
	session: {
		strategy: 'jwt',
		maxAge: 24 * 60 * 60, // 24 hours
	},
	providers: [
		CredentialsProvider({
			id: 'logai',
			name: 'LogAI',
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					return null;
				}

				try {
					// Authenticate with LogAI service
					const response = await fetch(`${logaiConfig.apiUrl}/auth/login`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${logaiConfig.clientSecret}`,
						},
						body: JSON.stringify({
							email: credentials.email,
							password: credentials.password,
							clientId: logaiConfig.clientId,
						}),
					});

					if (!response.ok) {
						return null;
					}

					const user = await response.json();

					return {
						id: user.id,
						email: user.email,
						name: user.name,
						accessToken: user.accessToken,
						refreshToken: user.refreshToken,
					};
				} catch (error) {
					console.error('LogAI authentication error:', error);
					return null;
				}
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }: { token: any; user: any }) {
			if (user) {
				token.accessToken = user.accessToken;
				token.refreshToken = user.refreshToken;
			}
			return token;
		},
		async session({ session, token }: { session: any; token: any }) {
			session.accessToken = token.accessToken as string;
			session.refreshToken = token.refreshToken as string;
			return session;
		},
	},
} satisfies NextAuthOptions;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
