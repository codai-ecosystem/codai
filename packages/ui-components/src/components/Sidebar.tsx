import React from 'react';

export interface SidebarProps {
	isOpen?: boolean;
	onToggle?: () => void;
	children?: React.ReactNode;
	className?: string;
}

/**
 * Sidebar component for AIDE interface
 * Provides collapsible navigation and tool panels
 */
export function Sidebar({
	isOpen = true,
	onToggle,
	children,
	className = ''
}: SidebarProps) {
	return (
		<aside
			className={`aide-sidebar ${isOpen ? 'open' : 'closed'} ${className}`}
			role="complementary"
			aria-label="Sidebar navigation"
		>
			{onToggle && (
				<button
					className="aide-sidebar-toggle"
					onClick={onToggle}
					aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
				>
					{isOpen ? '‹' : '›'}
				</button>
			)}
			<div className="aide-sidebar-content">
				{children}
			</div>
		</aside>
	);
}

export default Sidebar;
