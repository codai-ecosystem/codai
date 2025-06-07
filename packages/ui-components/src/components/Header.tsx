import React from 'react';

export interface HeaderProps {
	title?: string;
	subtitle?: string;
	actions?: React.ReactNode;
	children?: React.ReactNode;
	className?: string;
}

/**
 * Header component for CODAI.RO interface
 * Provides application title, breadcrumbs, and action buttons with modern styling
 */
export function Header({
	title = 'CODAI.RO',
	subtitle,
	actions,
	children,
	className = ''
}: HeaderProps) {
	return (
		<header
			className={`bg-codai-surface border-b border-codai-border/20 backdrop-blur-md sticky top-0 z-40 ${className}`}
			role="banner"
		>
			<div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
				<div className="flex items-center space-x-4">
					<div className="flex items-center space-x-3">
						<div className="w-8 h-8 bg-gradient-to-r from-codai-primary to-codai-accent rounded-lg flex items-center justify-center">
							<span className="text-white font-bold text-lg">C</span>
						</div>
						<div>
							<h1 className="text-xl font-bold bg-gradient-to-r from-codai-primary to-codai-accent bg-clip-text text-transparent">
								{title}
							</h1>
							{subtitle && (
								<span className="text-sm text-codai-muted-foreground">{subtitle}</span>
							)}
						</div>
					</div>
					{children && (
						<div className="ml-8">
							{children}
						</div>
					)}
				</div>
				{actions && (
					<div className="flex items-center space-x-3">
						{actions}
					</div>
				)}
			</div>
		</header>
	);
}

export default Header;
