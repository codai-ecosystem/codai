import React from 'react';

export interface SidebarProps {
	isOpen?: boolean;
	onToggle?: () => void;
	children?: React.ReactNode;
	className?: string;
}

/**
 * Sidebar component for CODAI.RO interface
 * Provides collapsible navigation and tool panels with modern styling
 */
export function Sidebar({
	isOpen = true,
	onToggle,
	children,
	className = ''
}: SidebarProps) {
	return (
		<aside
			className={`
				bg-codai-card border-r border-codai-border/20 
				transition-all duration-300 ease-in-out
				${isOpen ? 'w-64' : 'w-16'} 
				flex flex-col h-full
				${className}
			`}
			role="complementary"
			aria-label="Navigation sidebar"
		>
			{onToggle && (
				<button
					className="
						p-3 m-2 rounded-lg 
						hover:bg-codai-accent/10 
						transition-colors duration-200
						text-codai-muted-foreground hover:text-codai-foreground
						border border-codai-border/20
					"
					onClick={onToggle}
					aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
				>
					<svg 
						className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-0' : 'rotate-180'}`}
						fill="none" 
						stroke="currentColor" 
						viewBox="0 0 24 24"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
					</svg>
				</button>
			)}
			<div className={`flex-1 overflow-y-auto ${isOpen ? 'px-3 pb-3' : 'px-2 pb-2'}`}>
				{children}
			</div>
		</aside>
	);
}

export default Sidebar;
