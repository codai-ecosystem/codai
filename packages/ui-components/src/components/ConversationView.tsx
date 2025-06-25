import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { AgentMessage } from '@dragoscatalin/agent-runtime';
import { MessageBubble } from './MessageBubble';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ConversationViewProps } from '../types';

/**
 * Main conversation interface for AIDE
 * Displays conversation history and input for new messages
 */
export const ConversationView: React.FC<ConversationViewProps> = ({
	messages,
	onSendMessage,
	isLoading = false,
	placeholder = "Describe what you'd like to build...",
	className = '',
}) => {
	const [inputValue, setInputValue] = useState('');
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	// Focus input on mount
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const handleSend = () => {
		if (inputValue.trim() && !isLoading) {
			onSendMessage(inputValue.trim());
			setInputValue('');
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<div className={`aide-conversation ${className}`}>
			{/* Messages Area */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{messages.length === 0 ? (
					<div className="flex items-center justify-center h-full text-muted-foreground">
						<div className="text-center">
							<h3 className="text-lg font-semibold mb-2">Welcome to AIDE</h3>
							<p>Start by describing what you'd like to build.</p>
						</div>
					</div>
				) : (
					messages.map(message => (
						<MessageBubble
							key={message.id}
							message={message}
							isUser={message.type === 'request'}
							timestamp
						/>
					))
				)}
				{isLoading && (
					<div className="flex items-center space-x-2 text-muted-foreground">
						<Loader2 className="w-4 h-4 animate-spin" />
						<span>AIDE is thinking...</span>
					</div>
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Input Area */}
			<div className="border-t border-border p-4">
				<div className="flex space-x-2">
					<Input
						ref={inputRef}
						value={inputValue}
						onChange={e => setInputValue(e.target.value)}
						onKeyPress={handleKeyPress}
						placeholder={placeholder}
						disabled={isLoading}
						className="flex-1"
					/>
					<Button onClick={handleSend} disabled={!inputValue.trim() || isLoading} size="sm">
						{isLoading ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Send className="w-4 h-4" />
						)}
					</Button>
				</div>
			</div>
		</div>
	);
};
