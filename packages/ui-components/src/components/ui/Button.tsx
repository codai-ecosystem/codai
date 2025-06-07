import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
	size?: 'sm' | 'md' | 'lg';
	isLoading?: boolean;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ 
		className, 
		variant = 'primary', 
		size = 'md', 
		isLoading = false,
		leftIcon,
		rightIcon,
		children,
		disabled,
		...props 
	}, ref) => {
		const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

		const variantStyles = {
			primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 shadow-sm hover:shadow-md',
			secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-gray-500',
			ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-gray-500',
			danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm hover:shadow-md',
			success: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 shadow-sm hover:shadow-md',
			outline: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-indigo-500'
		};

		const sizeStyles = {
			sm: 'px-3 py-1.5 text-sm',
			md: 'px-4 py-2 text-sm',
			lg: 'px-6 py-3 text-base'
		};

		return (
			<button
				className={clsx(
					baseStyles,
					variantStyles[variant],
					sizeStyles[size],
					isLoading && 'cursor-wait',
					className
				)}
				ref={ref}
				disabled={disabled || isLoading}
				{...props}
			>
				{isLoading && (
					<svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						/>
						<path
							className="opacity-75"
							fill="currentColor"
							d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
				)}
				{!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
				{children}
				{!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
			</button>
		);
	}
);

Button.displayName = 'Button';

export { Button };
