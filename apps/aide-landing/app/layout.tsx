import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://aide.dev'),
	title: 'AIDE - AI-Native Development Environment',
	description:
		'The complete AI-powered development platform for modern software teams. Build, deploy, and scale with autonomous AI assistance.',
	keywords: 'AI development, autonomous coding, software development, VS Code, cloud IDE',
	authors: [{ name: 'AIDE Team' }],
	openGraph: {
		title: 'AIDE - AI-Native Development Environment',
		description: 'The complete AI-powered development platform for modern software teams.',
		type: 'website',
		images: ['/og-image.png'],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'AIDE - AI-Native Development Environment',
		description: 'The complete AI-powered development platform for modern software teams.',
		images: ['/og-image.png'],
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={inter.className}>{children}</body>
		</html>
	);
}
