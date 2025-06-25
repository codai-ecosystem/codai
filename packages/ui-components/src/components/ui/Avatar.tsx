import React from 'react';
import { clsx } from 'clsx';

interface AvatarProps {
	className?: string;
	children: React.ReactNode;
	size?: 'sm' | 'md' | 'lg' | 'xl';
}

interface AvatarImageProps {
	className?: string;
	src: string;
	alt: string;
}

interface AvatarFallbackProps {
	className?: string;
	children: React.ReactNode;
}

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
	({ className, size = 'md', ...props }, ref) => {
		const sizeClasses = {
			sm: 'h-8 w-8',
			md: 'h-10 w-10',
			lg: 'h-12 w-12',
			xl: 'h-16 w-16',
		};

		return (
			<span
				ref={ref}
				className={clsx(
					'relative flex shrink-0 overflow-hidden rounded-full',
					sizeClasses[size],
					className
				)}
				{...props}
			/>
		);
	}
);
Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
	({ className, ...props }, ref) => (
		<img
			ref={ref}
			className={clsx('aspect-square h-full w-full object-cover', className)}
			{...props}
		/>
	)
);
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef<HTMLSpanElement, AvatarFallbackProps>(
	({ className, ...props }, ref) => (
		<span
			ref={ref}
			className={clsx(
				'flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground',
				className
			)}
			{...props}
		/>
	)
);
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };
