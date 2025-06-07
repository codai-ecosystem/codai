'use client'

import React, { useState, useEffect } from 'react'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
	id: string;
	type: NotificationType;
	title: string;
	message?: string;
	duration?: number;
	action?: {
		label: string;
		onClick: () => void;
	};
}

interface NotificationProviderProps {
	children: React.ReactNode;
}

interface NotificationContextType {
	notifications: Notification[];
	addNotification: (notification: Omit<Notification, 'id'>) => void;
	removeNotification: (id: string) => void;
	clearAll: () => void;
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
	const context = React.useContext(NotificationContext)
	if (context === undefined) {
		throw new Error('useNotifications must be used within a NotificationProvider')
	}
	return context
}

export function NotificationProvider({ children }: NotificationProviderProps) {
	const [notifications, setNotifications] = useState<Notification[]>([])

	const addNotification = (notification: Omit<Notification, 'id'>) => {
		const id = Math.random().toString(36).substr(2, 9)
		const newNotification: Notification = {
			...notification,
			id,
			duration: notification.duration ?? 5000,
		}

		setNotifications(prev => [...prev, newNotification])
		// Auto remove after duration
		if (newNotification.duration && newNotification.duration > 0) {
			setTimeout(() => {
				removeNotification(id)
			}, newNotification.duration)
		}
	}

	const removeNotification = (id: string) => {
		setNotifications(prev => prev.filter(notification => notification.id !== id))
	}

	const clearAll = () => {
		setNotifications([])
	}

	return (
		<NotificationContext.Provider value={{
			notifications,
			addNotification,
			removeNotification,
			clearAll
		}}>
			{children}
			<NotificationContainer />
		</NotificationContext.Provider>
	)
}

function NotificationContainer() {
	const { notifications, removeNotification } = useNotifications()

	return (
		<div className="fixed top-4 right-4 z-50 space-y-4 max-w-sm w-full">
			{notifications.map((notification) => (
				<NotificationCard
					key={notification.id}
					notification={notification}
					onClose={() => removeNotification(notification.id)}
				/>
			))}
		</div>
	)
}

interface NotificationCardProps {
	notification: Notification;
	onClose: () => void;
}

function NotificationCard({ notification, onClose }: NotificationCardProps) {
	const [isVisible, setIsVisible] = useState(false)

	useEffect(() => {
		// Trigger animation
		setTimeout(() => setIsVisible(true), 50)
	}, [])

	const handleClose = () => {
		setIsVisible(false)
		setTimeout(onClose, 300) // Wait for animation
	}

	const getIcon = () => {
		switch (notification.type) {
			case 'success':
				return (
					<div className="w-5 h-5 text-emerald-400">
						<svg fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
						</svg>
					</div>
				)
			case 'error':
				return (
					<div className="w-5 h-5 text-red-400">
						<svg fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
						</svg>
					</div>
				)
			case 'warning':
				return (
					<div className="w-5 h-5 text-amber-400">
						<svg fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
						</svg>
					</div>
				)
			case 'info':
				return (
					<div className="w-5 h-5 text-blue-400">
						<svg fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
						</svg>
					</div>
				)
		}
	}

	const getBorderColor = () => {
		switch (notification.type) {
			case 'success': return 'border-emerald-500/20'
			case 'error': return 'border-red-500/20'
			case 'warning': return 'border-amber-500/20'
			case 'info': return 'border-blue-500/20'
		}
	}

	const getBackgroundColor = () => {
		switch (notification.type) {
			case 'success': return 'bg-emerald-50/90 dark:bg-emerald-900/20'
			case 'error': return 'bg-red-50/90 dark:bg-red-900/20'
			case 'warning': return 'bg-amber-50/90 dark:bg-amber-900/20'
			case 'info': return 'bg-blue-50/90 dark:bg-blue-900/20'
		}
	}

	return (
		<div className={`
			${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
			transform transition-all duration-300 ease-in-out
			${getBackgroundColor()}
			${getBorderColor()}
			backdrop-blur-sm border rounded-xl shadow-lg p-4 max-w-sm w-full
		`}>
			<div className="flex items-start">
				<div className="flex-shrink-0">
					{getIcon()}
				</div>
				<div className="ml-3 w-0 flex-1">
					<p className="text-sm font-medium text-gray-900 dark:text-white">
						{notification.title}
					</p>
					{notification.message && (
						<p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
							{notification.message}
						</p>
					)}
					{notification.action && (
						<div className="mt-3">
							<button
								onClick={notification.action.onClick}
								className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors duration-200"
							>
								{notification.action.label}
							</button>
						</div>
					)}
				</div>
				<div className="ml-4 flex-shrink-0 flex">
					<button
						onClick={handleClose}
						className="inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md transition-colors duration-200"
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	)
}
