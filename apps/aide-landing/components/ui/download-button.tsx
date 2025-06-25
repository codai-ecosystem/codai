'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, ExternalLink } from 'lucide-react';
import { Button } from './button';

interface DownloadOption {
	label: string;
	os: string;
	architecture: string;
	downloadUrl: string;
	fileSize: string;
}

const downloadOptions: DownloadOption[] = [
	{
		label: 'Windows x64',
		os: 'windows',
		architecture: 'x64',
		downloadUrl: 'https://github.com/aide-dev/aide/releases/latest/download/aide-windows-x64.exe',
		fileSize: '~150MB',
	},
	{
		label: 'Windows ARM64',
		os: 'windows',
		architecture: 'arm64',
		downloadUrl: 'https://github.com/aide-dev/aide/releases/latest/download/aide-windows-arm64.exe',
		fileSize: '~145MB',
	},
	{
		label: 'macOS Intel',
		os: 'mac',
		architecture: 'x64',
		downloadUrl: 'https://github.com/aide-dev/aide/releases/latest/download/aide-macos-x64.dmg',
		fileSize: '~140MB',
	},
	{
		label: 'macOS Apple Silicon',
		os: 'mac',
		architecture: 'arm64',
		downloadUrl: 'https://github.com/aide-dev/aide/releases/latest/download/aide-macos-arm64.dmg',
		fileSize: '~135MB',
	},
	{
		label: 'Linux x64',
		os: 'linux',
		architecture: 'x64',
		downloadUrl:
			'https://github.com/aide-dev/aide/releases/latest/download/aide-linux-x64.AppImage',
		fileSize: '~155MB',
	},
	{
		label: 'Linux ARM64',
		os: 'linux',
		architecture: 'arm64',
		downloadUrl:
			'https://github.com/aide-dev/aide/releases/latest/download/aide-linux-arm64.AppImage',
		fileSize: '~150MB',
	},
];

interface DetectedOS {
	name: 'windows' | 'mac' | 'linux' | 'unknown';
	architecture: 'x64' | 'arm64' | 'unknown';
}

function detectOS(): DetectedOS {
	if (typeof window === 'undefined') {
		return { name: 'unknown', architecture: 'unknown' };
	}

	const userAgent = window.navigator.userAgent.toLowerCase();
	const platform = window.navigator.platform.toLowerCase();

	let osName: DetectedOS['name'] = 'unknown';
	let architecture: DetectedOS['architecture'] = 'unknown';

	// Detect OS
	if (userAgent.includes('win') || platform.includes('win')) {
		osName = 'windows';
	} else if (userAgent.includes('mac') || platform.includes('mac')) {
		osName = 'mac';
	} else if (userAgent.includes('linux') || platform.includes('linux')) {
		osName = 'linux';
	}

	// Detect architecture
	if (userAgent.includes('arm64') || userAgent.includes('aarch64') || platform.includes('arm')) {
		architecture = 'arm64';
	} else if (
		userAgent.includes('x64') ||
		userAgent.includes('x86_64') ||
		platform.includes('x86_64')
	) {
		architecture = 'x64';
	} else if (userAgent.includes('wow64') || platform.includes('win64')) {
		architecture = 'x64';
	}

	return { name: osName, architecture };
}

interface DownloadButtonProps {
	variant?: 'primary' | 'secondary';
	size?: 'sm' | 'md' | 'lg';
	showDropdown?: boolean;
	className?: string;
}

export function DownloadButton({
	variant = 'primary',
	size = 'lg',
	showDropdown = true,
	className = '',
}: DownloadButtonProps) {
	const [detectedOS, setDetectedOS] = useState<DetectedOS>({
		name: 'unknown',
		architecture: 'unknown',
	});
	const [showAllOptions, setShowAllOptions] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		setDetectedOS(detectOS());
	}, []);

	const getRecommendedDownload = (): DownloadOption | null => {
		if (detectedOS.name === 'unknown') return null;

		return (
			downloadOptions.find(
				option =>
					option.os === detectedOS.name &&
					(option.architecture === detectedOS.architecture || detectedOS.architecture === 'unknown')
			) ||
			downloadOptions.find(option => option.os === detectedOS.name) ||
			null
		);
	};

	const handleDownload = async (downloadUrl: string) => {
		setIsLoading(true);
		try {
			// Track download event
			if (typeof window !== 'undefined' && (window as any).gtag) {
				(window as any).gtag('event', 'download', {
					event_category: 'engagement',
					event_label: downloadUrl,
				});
			}

			// Trigger download
			window.open(downloadUrl, '_blank');
		} catch (error) {
			console.error('Download failed:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const recommendedDownload = getRecommendedDownload();

	const buttonVariants = {
		primary:
			'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white',
		secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
	};

	const sizeVariants = {
		sm: 'px-4 py-2 text-sm',
		md: 'px-6 py-3 text-base',
		lg: 'px-8 py-4 text-lg',
	};

	if (!recommendedDownload && !showAllOptions) {
		return (
			<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
				<Button
					onClick={() => setShowAllOptions(true)}
					className={`${buttonVariants[variant]} ${sizeVariants[size]} ${className} font-semibold rounded-xl transition-all duration-300`}
				>
					<Download className="w-5 h-5 mr-2" />
					Download AIDE
				</Button>
			</motion.div>
		);
	}

	return (
		<div className="relative">
			{recommendedDownload && !showAllOptions ? (
				<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="group">
					<Button
						onClick={() => handleDownload(recommendedDownload.downloadUrl)}
						disabled={isLoading}
						className={`${buttonVariants[variant]} ${sizeVariants[size]} ${className} font-semibold rounded-xl transition-all duration-300 relative overflow-hidden`}
					>
						<motion.div
							className="absolute inset-0 bg-white/20"
							initial={{ x: '-100%' }}
							whileHover={{ x: '100%' }}
							transition={{ duration: 0.6 }}
						/>
						<Download className="w-5 h-5 mr-2 relative z-10" />
						<span className="relative z-10">
							{isLoading ? 'Downloading...' : `Download for ${recommendedDownload.label}`}
						</span>
					</Button>

					{showDropdown && (
						<motion.button
							onClick={() => setShowAllOptions(true)}
							className="ml-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all duration-300"
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							<ExternalLink className="w-4 h-4" />
						</motion.button>
					)}
				</motion.div>
			) : (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-gray-900/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
				>
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-white">Choose your platform</h3>
						<button
							onClick={() => setShowAllOptions(false)}
							className="text-gray-400 hover:text-white transition-colors"
						>
							×
						</button>
					</div>

					<div className="space-y-2">
						{downloadOptions.map((option, index) => (
							<motion.button
								key={option.label}
								onClick={() => handleDownload(option.downloadUrl)}
								disabled={isLoading}
								className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-600/50 hover:border-gray-500 transition-all duration-300 text-left group"
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.1 }}
								whileHover={{ x: 4 }}
							>
								<div className="flex items-center">
									<Download className="w-4 h-4 mr-3 text-gray-400 group-hover:text-white transition-colors" />
									<div>
										<div className="text-white font-medium">{option.label}</div>
										<div className="text-sm text-gray-400">{option.fileSize}</div>
									</div>
								</div>
								<ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
							</motion.button>
						))}
					</div>

					<div className="mt-4 pt-4 border-t border-gray-700">
						<p className="text-sm text-gray-400 text-center">
							Can't find your platform? Check our{' '}
							<a
								href="https://github.com/aide-dev/aide/releases"
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-400 hover:text-blue-300 underline"
							>
								GitHub releases
							</a>
						</p>
					</div>
				</motion.div>
			)}
		</div>
	);
}
