import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

interface DropdownProps {
	children: React.ReactNode;
	className?: string;
}

interface DropdownTriggerProps {
	children: React.ReactNode;
	className?: string;
	asChild?: boolean;
}

interface DropdownContentProps {
	children: React.ReactNode;
	className?: string;
	align?: 'start' | 'center' | 'end';
	side?: 'top' | 'right' | 'bottom' | 'left';
}

interface DropdownItemProps {
	children: React.ReactNode;
	className?: string;
	onClick?: () => void;
	disabled?: boolean;
}

interface DropdownSeparatorProps {
	className?: string;
}

const DropdownContext = React.createContext<{
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	triggerRef: React.RefObject<HTMLElement>;
} | null>(null);

const Dropdown = ({ children, className }: DropdownProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const triggerRef = useRef<HTMLElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	return (
		<DropdownContext.Provider value={{ isOpen, setIsOpen, triggerRef }}>
			<div className={clsx('relative inline-block', className)}>
				{children}
			</div>
		</DropdownContext.Provider>
	);
};

const DropdownTrigger = ({ children, className, asChild = false }: DropdownTriggerProps) => {
	const context = React.useContext(DropdownContext);
	if (!context) throw new Error('DropdownTrigger must be used within Dropdown');

	const { isOpen, setIsOpen, triggerRef } = context;

	const handleClick = () => {
		setIsOpen(!isOpen);
	};
	if (asChild && React.isValidElement(children)) {
		return React.cloneElement(children as React.ReactElement<any>, {
			ref: triggerRef,
			onClick: handleClick,
			className: clsx(children.props.className, className),
		});
	}

	return (
		<button
			ref={triggerRef as React.RefObject<HTMLButtonElement>}
			onClick={handleClick}
			className={clsx(
				'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
				className
			)}
		>
			{children}
		</button>
	);
};

const DropdownContent = ({ children, className, align = 'center', side = 'bottom' }: DropdownContentProps) => {
	const context = React.useContext(DropdownContext);
	if (!context) throw new Error('DropdownContent must be used within Dropdown');

	const { isOpen } = context;

	if (!isOpen) return null;

	const alignClasses = {
		start: 'left-0',
		center: 'left-1/2 transform -translate-x-1/2',
		end: 'right-0'
	};

	const sideClasses = {
		top: 'bottom-full mb-2',
		right: 'left-full ml-2',
		bottom: 'top-full mt-2',
		left: 'right-full mr-2'
	};

	return (
		<div
			className={clsx(
				'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95',
				alignClasses[align],
				sideClasses[side],
				className
			)}
		>
			{children}
		</div>
	);
};

const DropdownItem = ({ children, className, onClick, disabled = false }: DropdownItemProps) => {
	const context = React.useContext(DropdownContext);
	if (!context) throw new Error('DropdownItem must be used within Dropdown');

	const { setIsOpen } = context;

	const handleClick = () => {
		if (!disabled && onClick) {
			onClick();
			setIsOpen(false);
		}
	};

	return (
		<button
			onClick={handleClick}
			disabled={disabled}
			className={clsx(
				'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
				className
			)}
		>
			{children}
		</button>
	);
};

const DropdownSeparator = ({ className }: DropdownSeparatorProps) => (
	<div className={clsx('-mx-1 my-1 h-px bg-muted', className)} />
);

export { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator };
