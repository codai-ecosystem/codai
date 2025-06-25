import React from 'react';

export interface NavItem {
	id: string;
	label: string;
	icon?: React.ReactNode;
	href?: string;
	onClick?: () => void;
	active?: boolean;
	badge?: string | number;
	children?: NavItem[];
}

export interface NavigationProps {
	items: NavItem[];
	collapsed?: boolean;
	className?: string;
}

/**
 * Navigation component for CODAI.RO interface
 * Provides modern navigation with icons, badges, and nested items
 */
export function Navigation({ items, collapsed = false, className = '' }: NavigationProps) {
	const renderNavItem = (item: NavItem, depth = 0) => {
		const { id, label, icon, href, onClick, active = false, badge, children } = item;

		const handleClick = (e: React.MouseEvent) => {
			if (onClick) {
				e.preventDefault();
				onClick();
			}
		};

		const baseClasses = `
			flex items-center space-x-3 p-3 rounded-lg 
			transition-all duration-200 
			hover:bg-codai-accent/10 
			${active ? 'bg-codai-accent/20 text-codai-accent border-r-2 border-codai-accent' : 'text-codai-muted-foreground hover:text-codai-foreground'}
			${collapsed ? 'justify-center' : ''}
		`;

		const content = (
			<>
				{icon && <div className="flex-shrink-0 w-5 h-5">{icon}</div>}
				{!collapsed && <span className="flex-1 font-medium">{label}</span>}
				{!collapsed && badge && (
					<span className="bg-codai-accent text-codai-accent-foreground px-2 py-1 rounded-full text-xs font-medium">
						{badge}
					</span>
				)}
			</>
		);

		const element = href ? (
			<a
				key={id}
				href={href}
				onClick={handleClick}
				className={baseClasses}
				style={{ paddingLeft: `${(depth + 1) * 0.75}rem` }}
			>
				{content}
			</a>
		) : (
			<button
				key={id}
				onClick={handleClick}
				className={`${baseClasses} w-full text-left`}
				style={{ paddingLeft: `${(depth + 1) * 0.75}rem` }}
			>
				{content}
			</button>
		);

		return (
			<div key={id}>
				{element}
				{children && !collapsed && (
					<div className="ml-4 mt-1 space-y-1">
						{children.map(child => renderNavItem(child, depth + 1))}
					</div>
				)}
			</div>
		);
	};

	return (
		<nav className={`space-y-1 ${className}`} role="navigation">
			{items.map(item => renderNavItem(item))}
		</nav>
	);
}

export default Navigation;
