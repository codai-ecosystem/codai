import React, { useState } from 'react';
import { clsx } from 'clsx';

interface SearchBarProps {
	placeholder?: string;
	value?: string;
	onChange?: (value: string) => void;
	onSubmit?: (value: string) => void;
	className?: string;
	size?: 'sm' | 'md' | 'lg';
	variant?: 'default' | 'ghost';
	icon?: React.ReactNode;
	showClearButton?: boolean;
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
	({
		placeholder = 'Search...',
		value: controlledValue,
		onChange,
		onSubmit,
		className,
		size = 'md',
		variant = 'default',
		icon,
		showClearButton = true,
		...props
	}, ref) => {
		const [internalValue, setInternalValue] = useState('');
		const value = controlledValue !== undefined ? controlledValue : internalValue;

		const sizeClasses = {
			sm: 'h-8 text-sm px-3',
			md: 'h-10 text-sm px-4',
			lg: 'h-12 text-base px-5'
		};

		const variantClasses = {
			default: 'border border-input bg-background',
			ghost: 'border-0 bg-muted/50'
		};

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.value;
			if (controlledValue === undefined) {
				setInternalValue(newValue);
			}
			onChange?.(newValue);
		};

		const handleSubmit = (e: React.FormEvent) => {
			e.preventDefault();
			onSubmit?.(value);
		};

		const handleClear = () => {
			const newValue = '';
			if (controlledValue === undefined) {
				setInternalValue(newValue);
			}
			onChange?.(newValue);
		};

		const hasIcon = !!icon;
		const showClear = showClearButton && value.length > 0;

		return (
			<form onSubmit={handleSubmit} className="relative">
				<div className="relative">
					{hasIcon && (
						<div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
							{icon}
						</div>
					)}
					<input
						ref={ref}
						type="text"
						value={value}
						onChange={handleChange}
						placeholder={placeholder}
						className={clsx(
							'w-full rounded-lg ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
							sizeClasses[size],
							variantClasses[variant],
							hasIcon && 'pl-10',
							showClear && 'pr-10',
							className
						)}
						{...props}
					/>
					{showClear && (
						<button
							type="button"
							onClick={handleClear}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="m18 6-12 12" />
								<path d="m6 6 12 12" />
							</svg>
						</button>
					)}
				</div>
			</form>
		);
	}
);

SearchBar.displayName = 'SearchBar';

export { SearchBar };
