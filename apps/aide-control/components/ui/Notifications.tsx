'use client'

import React, { createContext, useContext, useReducer, useCallback, useState, useEffect } from 'react'
import { XMarkIcon, BellIcon } from '@heroicons/react/24/outline'

export interface Notification {
	id: string;
	type: 'success' | 'error' | 'warning' | 'info';
	title: string;
	message?: string;
	duration?: number;
	actions?: Array<{
		label: string;
		action: () => void;
		variant?: 'primary' | 'secondary';
	}>;
	createdAt?: Date;
}

interface NotificationState {
	notifications: Notification[];
}

type NotificationAction =
	| { type: 'ADD_NOTIFICATION'; payload: Notification }
	| { type: 'REMOVE_NOTIFICATION'; payload: string }
	| { type: 'CLEAR_ALL' };

const initialState: NotificationState = {
	notifications: []
};

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
	switch (action.type) {
		case 'ADD_NOTIFICATION':
			return {
				...state,
				notifications: [...state.notifications, action.payload]
			};
		case 'REMOVE_NOTIFICATION':
			return {
				...state,
				notifications: state.notifications.filter(n => n.id !== action.payload)
			};
		case 'CLEAR_ALL':
			return {
				...state,
				notifications: []
			};
		default:
			return state;
	}
}

interface NotificationContextType {
	notifications: Notification[];
	addNotification: (notification: Omit<Notification, 'id'>) => string;
	removeNotification: (id: string) => void;
	clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
	const [state, dispatch] = useReducer(notificationReducer, initialState);
	
	// Local storage key for persisting notifications
	const STORAGE_KEY = 'codai_notifications';
	
	// Load notifications from localStorage on mount
	useEffect(() => {
		try {
			const savedNotifications = localStorage.getItem(STORAGE_KEY);
			if (savedNotifications) {
				const parsed = JSON.parse(savedNotifications);
				if (Array.isArray(parsed) && parsed.length > 0) {
					// Only load notifications from the last 24 hours
					const recentNotifications = parsed.filter(n => {
						if (!n.createdAt) return false;
						const date = new Date(n.createdAt);
						const now = new Date();
						const diff = now.getTime() - date.getTime();
						return diff < 1000 * 60 * 60 * 24; // 24 hours
					});
					
					if (recentNotifications.length > 0) {
						recentNotifications.forEach(n => {
							dispatch({ type: 'ADD_NOTIFICATION', payload: n });
						});
					}
				}
			}
		} catch (error) {
			console.error('Error loading notifications from localStorage', error);
		}
	}, []);
	
	// Save notifications to localStorage when they change
	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state.notifications));
		} catch (error) {
			console.error('Error saving notifications to localStorage', error);
		}
	}, [state.notifications]);

	const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
		const id = Math.random().toString(36).substr(2, 9);
		const fullNotification: Notification = {
			...notification,
			id,
			duration: notification.duration ?? 5000,
			createdAt: new Date()
		};

		dispatch({ type: 'ADD_NOTIFICATION', payload: fullNotification });

		// Auto-remove after duration
		if (fullNotification.duration && fullNotification.duration > 0) {
			setTimeout(() => {
				dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
			}, fullNotification.duration);
		}

		return id;
	}, []);

	const removeNotification = useCallback((id: string) => {
		dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
	}, []);

	const clearAll = useCallback(() => {
		dispatch({ type: 'CLEAR_ALL' });
		
		// Also clear from localStorage
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch (error) {
			console.error('Error clearing notifications from localStorage', error);
		}
	}, []);

	return (
		<NotificationContext.Provider
			value={{
				notifications: state.notifications,
				addNotification,
				removeNotification,
				clearAll
			}}
		>
			{children}
			<NotificationContainer />
		</NotificationContext.Provider>
	);
}

export function useNotifications() {
	const context = useContext(NotificationContext);
	if (context === undefined) {
		throw new Error('useNotifications must be used within a NotificationProvider');
	}
	return context;
}

function NotificationContainer() {
	const { notifications, removeNotification } = useNotifications();
	const [collapsed, setCollapsed] = useState(false);
	const [notificationCount, setNotificationCount] = useState(0);
	
	// Track notification count for the collapsed indicator
	useEffect(() => {
		setNotificationCount(notifications.length);
	}, [notifications.length]);
	
	// Auto-collapse when there are too many notifications
	useEffect(() => {
		if (notifications.length > 3 && !collapsed) {
			setCollapsed(true);
		} else if (notifications.length === 0) {
			setCollapsed(false);
		}
	}, [notifications.length, collapsed]);

	if (notifications.length === 0) {
		return null;
	}
	
	if (collapsed) {
		return (
			<div className="fixed top-4 right-4 z-50">
				<button
					onClick={() => setCollapsed(false)}
					className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 relative"
					aria-label={`Show ${notifications.length} notifications`}
				>
					<BellIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
					<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
						{notificationCount}
					</span>
				</button>
			</div>
		);
	}

	return (
		<div 
			className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full sm:w-96"
			role="region"
			aria-label="Notifications"
			aria-live="polite"
		>
			<div className="flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg mb-2">
				<span className="font-medium text-gray-900 dark:text-white text-sm flex items-center">
					<BellIcon className="h-4 w-4 mr-2" />
					{notifications.length} Notification{notifications.length !== 1 ? 's' : ''}
				</span>
				<div className="flex items-center space-x-2">
					<button
						onClick={() => setCollapsed(true)}
						className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
						aria-label="Collapse notifications"
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
						</svg>
					</button>
				</div>
			</div>
			
			<div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1 pb-1">
				{notifications.map((notification) => (
					<NotificationCard
						key={notification.id}
						notification={notification}
						onRemove={() => removeNotification(notification.id)}
					/>
				))}
			</div>
		</div>
	);
}

interface NotificationCardProps {
	notification: Notification;
	onRemove: () => void;
}

function NotificationCard({ notification, onRemove }: NotificationCardProps) {
	const [progress, setProgress] = useState(100);
	const [isHovering, setIsHovering] = useState(false);
		// Calculate how much time has passed since notification was created (for auto-dismissal progress)
	useEffect(() => {
		if (notification.duration && notification.duration > 0 && !isHovering) {
			const startTime = Date.now();
			const duration = notification.duration; // Store in a local variable to avoid undefined checks
			
			const interval = setInterval(() => {
				const elapsed = Date.now() - startTime;
				const remaining = 100 - (elapsed / duration * 100);
				setProgress(remaining > 0 ? remaining : 0);
				
				if (remaining <= 0) {
					clearInterval(interval);
				}
			}, 100);
			
			return () => clearInterval(interval);
		}
		
		return () => {}; // Empty cleanup function for when condition isn't met
	}, [notification.duration, isHovering]);
	
	const typeStyles = {
		success: 'bg-green-50 border-l-4 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-500 dark:text-green-200',
		error: 'bg-red-50 border-l-4 border-red-500 text-red-800 dark:bg-red-900/30 dark:border-red-500 dark:text-red-200',
		warning: 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-500 dark:text-yellow-200',
		info: 'bg-blue-50 border-l-4 border-blue-500 text-blue-800 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-200'
	};
	
	const progressColors = {
		success: 'bg-green-500 dark:bg-green-500',
		error: 'bg-red-500 dark:bg-red-500',
		warning: 'bg-yellow-500 dark:bg-yellow-500',
		info: 'bg-blue-500 dark:bg-blue-500'
	};

	const iconMap = {
		success: (
			<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
				<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
			</svg>
		),
		error: (
			<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
				<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
			</svg>
		),
		warning: (
			<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
				<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
			</svg>
		),
		info: (
			<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
				<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
			</svg>
		)
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === 'Escape') {
			onRemove();
		}
	};
	
	// Format the time when the notification was created
	const formatCreationTime = () => {
		if (!notification.createdAt) return null;
		
		const date = new Date(notification.createdAt);
		const now = new Date();
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
		
		if (diffInMinutes < 1) return 'Just now';
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
		return `${Math.floor(diffInMinutes / 1440)}d ago`;
	};

	return (
		<div 
			className={`relative p-4 rounded-lg shadow-lg backdrop-blur-sm ${typeStyles[notification.type]} animate-in slide-in-from-right duration-300 overflow-hidden`}
			role="alert"
			aria-describedby={`notification-${notification.id}`}
			onKeyDown={handleKeyDown}
			tabIndex={0}
			onMouseEnter={() => setIsHovering(true)}
			onMouseLeave={() => setIsHovering(false)}
		>
			{/* Progress bar for auto-dismiss countdown */}
			{notification.duration && notification.duration > 0 && (
				<div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
					<div 
						className={`h-full ${progressColors[notification.type]} transition-all duration-200 ease-linear`}
						style={{ width: `${progress}%` }}
					></div>
				</div>
			)}
			
			<div className="flex items-start space-x-3">
				<div className="flex-shrink-0 mt-0.5">
					{iconMap[notification.type]}
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex items-baseline justify-between">
						<h4 className="font-semibold text-sm" id={`notification-${notification.id}`}>
							{notification.title}
						</h4>
						{notification.createdAt && (
							<span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
								{formatCreationTime()}
							</span>
						)}
					</div>
					
					{notification.message && (
						<p className="mt-1 text-sm opacity-90 leading-relaxed">{notification.message}</p>
					)}
					{notification.actions && notification.actions.length > 0 && (
						<div className="mt-3 flex flex-wrap gap-2">
							{notification.actions.map((action, index) => (
								<button
									key={index}
									onClick={() => {
										action.action();
										onRemove();
									}}
									className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
										action.variant === 'primary'
											? `bg-${notification.type === 'info' ? 'blue' : notification.type === 'warning' ? 'yellow' : notification.type}-600 text-white hover:bg-${notification.type === 'info' ? 'blue' : notification.type === 'warning' ? 'yellow' : notification.type}-700 focus:ring-${notification.type === 'info' ? 'blue' : notification.type === 'warning' ? 'yellow' : notification.type}-500`
											: `bg-transparent border border-${notification.type === 'info' ? 'blue' : notification.type === 'warning' ? 'yellow' : notification.type}-500 text-${notification.type === 'info' ? 'blue' : notification.type === 'warning' ? 'yellow' : notification.type}-700 dark:text-${notification.type === 'info' ? 'blue' : notification.type === 'warning' ? 'yellow' : notification.type}-400 hover:bg-${notification.type === 'info' ? 'blue' : notification.type === 'warning' ? 'yellow' : notification.type}-50 dark:hover:bg-${notification.type === 'info' ? 'blue' : notification.type === 'warning' ? 'yellow' : notification.type}-900/30 focus:ring-${notification.type === 'info' ? 'blue' : notification.type === 'warning' ? 'yellow' : notification.type}-500`
									}`}
								>
									{action.label}
								</button>
							))}
						</div>
					)}
				</div>
				<button
					onClick={onRemove}
					className="flex-shrink-0 ml-2 p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
					aria-label={`Dismiss ${notification.title} notification`}
				>
					<XMarkIcon className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
}
