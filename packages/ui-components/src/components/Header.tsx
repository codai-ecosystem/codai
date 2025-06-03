import React from 'react';

export interface HeaderProps {
	title?: string;
	subtitle?: string;
	actions?: React.ReactNode;
	children?: React.ReactNode;
	className?: string;
}

/**
 * Header component for AIDE interface
 * Provides application title, breadcrumbs, and action buttons
 */
export function Header({
	title = 'AIDE',
	subtitle,
	actions,
	children,
	className = ''
}: HeaderProps) {
	return (
		<header
			className={`aide-header ${className}`}
			role="banner"
		>
			<div className="aide-header-content">
				<div className="aide-header-branding">
					<h1 className="aide-header-title">{title}</h1>
					{subtitle && (
						<span className="aide-header-subtitle">{subtitle}</span>
					)}
				</div>
				{children && (
					<div className="aide-header-main">
						{children}
					</div>
				)}
				{actions && (
					<div className="aide-header-actions">
						{actions}
					</div>
				)}
			</div>
		</header>
	);
}

export default Header;
