import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '../lib/auth-context'
import { ThemeProvider } from 'next-themes'
import { NotificationProvider } from '../components/ui/Notifications'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CODAI.RO Control Panel',
  description: 'Administrative dashboard for the CODAI.RO platform - AI-native development environment',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <NotificationProvider>
              <div className="min-h-screen bg-background">
                {children}
              </div>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
