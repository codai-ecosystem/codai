import React from 'react';

export interface IconProps {
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	className?: string;
}

const sizeClasses = {
	xs: 'w-3 h-3',
	sm: 'w-4 h-4',
	md: 'w-5 h-5',
	lg: 'w-6 h-6',
	xl: 'w-8 h-8'
};

/**
 * Icon library for CODAI.RO interface
 * Provides consistent iconography across the application
 */

export const Icons = {
	// Navigation & UI
	ChevronRight: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
		</svg>
	),

	ChevronDown: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
		</svg>
	),

	ChevronLeft: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
		</svg>
	),

	Menu: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
		</svg>
	),

	X: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
		</svg>
	),

	// Core features
	Code: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
		</svg>
	),

	Terminal: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
		</svg>
	),

	Bot: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
		</svg>
	),

	// Users & Management
	Users: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
		</svg>
	),

	User: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
		</svg>
	),

	// Analytics & Metrics
	Chart: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
		</svg>
	),

	TrendingUp: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
		</svg>
	),

	TrendingDown: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
		</svg>
	),

	// Security & API
	Key: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
		</svg>
	),

	Shield: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
		</svg>
	),

	// System & Status
	CheckCircle: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>
	),

	AlertCircle: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>
	),

	XCircle: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>
	),

	// Utilities
	Search: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
		</svg>
	),

	Settings: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
		</svg>
	),

	Bell: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
		</svg>
	),

	// Billing & Finance
	CreditCard: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
		</svg>
	),

	DollarSign: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
		</svg>
	),

	// Activity & Time
	Clock: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>
	),

	Lightning: ({ size = 'md', className = '' }: IconProps) => (
		<svg className={`${sizeClasses[size]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
		</svg>
	)
};

export default Icons;
