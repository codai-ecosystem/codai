import React from 'react';
import { Clock, User, Bot } from 'lucide-react';
import { AgentMessage } from '@dragoscatalin/agent-runtime';
import { MessageBubbleProps } from '../types';

/**
 * Individual message bubble component
 * Displays a single message in the conversation
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({
	message,
	isUser = false,
	timestamp = false,
	actions,
	className = '',
}) => {
	const formatTimestamp = (date: Date) => {
		return new Intl.DateTimeFormat('en-US', {
			hour: '2-digit',
			minute: '2-digit',
		}).format(date);
	};

	const getMessageTypeIcon = () => {
		switch (message.type) {
			case 'request':
				return <User className="w-4 h-4" />;
			case 'response':
				return <Bot className="w-4 h-4" />;
			case 'notification':
				return <Bot className="w-4 h-4 text-blue-500" />;
			case 'error':
				return <Bot className="w-4 h-4 text-red-500" />;
			default:
				return <Bot className="w-4 h-4" />;
		}
	};

	const getMessageStyles = () => {
		if (message.type === 'error') {
			return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200';
		}
		if (message.type === 'notification') {
			return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200';
		}
		if (isUser) {
			return 'aide-message-user';
		}
		return 'aide-message-agent';
	};

	return (
		<div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}>
			<div className={`aide-message-bubble ${getMessageStyles()}`}>
				{/* Message Header */}
				<div className="flex items-center space-x-2 mb-1">
					{getMessageTypeIcon()}
					<span className="text-xs font-medium">
						{isUser ? 'You' : `Agent ${message.agentId}`}
					</span>
					{timestamp && (
						<div className="flex items-center space-x-1 text-xs opacity-70">
							<Clock className="w-3 h-3" />
							<span>{formatTimestamp(message.timestamp)}</span>
						</div>
					)}
				</div>

				{/* Message Content */}
				<div className="text-sm whitespace-pre-wrap break-words">
					{message.content}
				</div>

				{/* Message Metadata */}
				{message.metadata && Object.keys(message.metadata).length > 0 && (
					<div className="mt-2 text-xs opacity-60">
						<details>
							<summary className="cursor-pointer">Metadata</summary>
							<pre className="mt-1 overflow-x-auto">
								{JSON.stringify(message.metadata, null, 2)}
							</pre>
						</details>
					</div>
				)}

				{/* Actions */}
				{actions && (
					<div className="mt-2 flex space-x-2">
						{actions}
					</div>
				)}
			</div>
		</div>
	);
};
