import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
	className?: string;
	children: React.ReactNode;
	variant?: 'default' | 'outlined' | 'elevated' | 'ghost';
	interactive?: boolean;
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

interface CardDescriptionProps {
	className?: string;
	children: React.ReactNode;
}

interface CardFooterProps {
	className?: string;
	children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(	({ className, variant = 'default', interactive = false, ...props }, ref) => {
		const variantClasses = {
			default: 'border border-codai-border/20 bg-codai-card shadow-sm',
			outlined: 'border-2 border-codai-border bg-transparent',
			elevated: 'border-0 bg-codai-card shadow-lg',
			ghost: 'border-0 bg-transparent shadow-none'
		};

		const interactiveClasses = interactive
			? 'hover:shadow-lg hover:shadow-codai-primary/10 hover:scale-[1.02] hover:border-codai-primary/30 transition-all duration-200 cursor-pointer'
			: '';

		return (
			<div
				ref={ref}
				className={clsx(
					'rounded-xl text-codai-card-foreground backdrop-blur-sm',
					variantClasses[variant],
					interactiveClasses,
					className
				)}
				{...props}
			/>
		);
	}
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={clsx("flex flex-col space-y-1.5 p-6 pb-3", className)}
			{...props}
		/>
	)
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
	({ className, ...props }, ref) => (
		<h3
			ref={ref}			className={clsx(
				"text-xl font-semibold leading-none tracking-tight text-codai-foreground",
				className
			)}
			{...props}
		/>
	)
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
	({ className, ...props }, ref) => (
		<p
			ref={ref}
			className={clsx("text-sm text-codai-muted-foreground", className)}
			{...props}
		/>
	)
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={clsx("p-6 pt-0", className)} {...props} />
	)
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={clsx("flex items-center p-6 pt-0", className)}
			{...props}
		/>
	)
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
