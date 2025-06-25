import React from 'react';

export interface LayoutProps {
	children: React.ReactNode;
	header?: React.ReactNode;
	sidebar?: React.ReactNode;
	statusBar?: React.ReactNode;
	className?: string;
}

export const Layout: React.FC<LayoutProps> = ({
	children,
	header,
	sidebar,
	statusBar,
	className = '',
}) => {
	return (
		<div className={`h-screen flex flex-col ${className}`}>
			{header && <div className="flex-shrink-0">{header}</div>}
			<div className="flex-1 flex overflow-hidden">
				{sidebar && <div className="flex-shrink-0">{sidebar}</div>}
				<main className="flex-1 overflow-auto">{children}</main>
			</div>
			{statusBar && <div className="flex-shrink-0">{statusBar}</div>}
		</div>
	);
};
