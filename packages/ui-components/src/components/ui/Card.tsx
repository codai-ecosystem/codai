import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
	className?: string;
	children: React.ReactNode;
}

interface CardHeaderProps {
	className?: string;
	children: React.ReactNode;
}

interface CardContentProps {
	className?: string;
	children: React.ReactNode;
}

interface CardTitleProps {
	className?: string;
	children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={clsx(
				"rounded-lg border bg-card text-card-foreground shadow-sm",
				className
			)}
			{...props}
		/>
	)
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={clsx("flex flex-col space-y-1.5 p-6", className)}
			{...props}
		/>
	)
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
	({ className, ...props }, ref) => (
		<h3
			ref={ref}
			className={clsx(
				"text-2xl font-semibold leading-none tracking-tight",
				className
			)}
			{...props}
		/>
	)
);
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={clsx("p-6 pt-0", className)} {...props} />
	)
);
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };
