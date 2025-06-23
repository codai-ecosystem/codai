import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '../lib/auth-context'
import { ThemeProvider } from 'next-themes'
import { NotificationProvider } from '../components/ui/Notifications'
import { SessionProvider } from 'next-auth/react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
	title: 'CODAI.RO Control Panel - Ecosystem Integration',
	description: 'Administrative dashboard for the CODAI.RO platform - AI-native development environment with ecosystem integration',
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={inter.className}>
				<SessionProvider>
					<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
						<AuthProvider>
							<NotificationProvider>
								<div className="min-h-screen bg-background">
									{children}
								</div>
							</NotificationProvider>
						</AuthProvider>
					</ThemeProvider>
				</SessionProvider>
			</body>
		</html>
	)
}
