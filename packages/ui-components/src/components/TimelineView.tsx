import React from 'react';

export interface TimelineEvent {
	id: string;
	title: string;
	description?: string;
	timestamp: Date;
	type: 'info' | 'success' | 'warning' | 'error';
	metadata?: Record<string, any>;
}

export interface TimelineViewProps {
	events: TimelineEvent[];
	className?: string;
	onEventClick?: (event: TimelineEvent) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
	events,
	className = '',
	onEventClick
}) => {
	const getEventTypeClasses = (type: TimelineEvent['type']) => {
		switch (type) {
			case 'success':
				return 'bg-green-500 border-green-200';
			case 'warning':
				return 'bg-yellow-500 border-yellow-200';
			case 'error':
				return 'bg-red-500 border-red-200';
			default:
				return 'bg-blue-500 border-blue-200';
		}
	};

	const formatTime = (date: Date) => {
		return new Intl.DateTimeFormat('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			month: 'short',
			day: 'numeric'
		}).format(date);
	};

	return (
		<div className={`space-y-4 ${className}`}>
			{events.length === 0 ? (
				<div className="text-center text-gray-500 py-8">
					No events to display
				</div>
			) : (
				events.map((event, index) => (
					<div key={event.id} className="relative">
						{index !== events.length - 1 && (
							<div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200" />
						)}
						<div
							className={`flex items-start space-x-3 ${onEventClick ? 'cursor-pointer hover:bg-gray-50 p-2 rounded' : ''}`}
							onClick={() => onEventClick?.(event)}
						>
							<div className={`w-3 h-3 rounded-full border-2 ${getEventTypeClasses(event.type)} flex-shrink-0 mt-1`} />
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between">
									<h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
									<time className="text-xs text-gray-500">{formatTime(event.timestamp)}</time>
								</div>
								{event.description && (
									<p className="text-sm text-gray-600 mt-1">{event.description}</p>
								)}
							</div>
						</div>
					</div>
				))
			)}
		</div>
	);
};
