import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
	({ className, variant = 'default', ...props }, ref) => {
		const variantStyles = {
			default: 'bg-codai-primary hover:bg-codai-primary/80 text-codai-primary-foreground',
			secondary: 'bg-codai-secondary hover:bg-codai-secondary/80 text-codai-secondary-foreground',
			destructive: 'bg-red-500 hover:bg-red-600 text-white',
			outline:
				'text-codai-foreground border border-codai-border hover:bg-codai-accent/10 hover:text-codai-accent',
		};

		return (
			<div
				ref={ref}
				className={clsx(
					'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-codai-primary focus:ring-offset-2',
					variantStyles[variant],
					className
				)}
				{...props}
			/>
		);
	}
);

Badge.displayName = 'Badge';

export { Badge };
