import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Bot, User, Zap, Archive, Settings } from 'lucide-react';
import { AgentMessage, AgentRuntime, ConversationContext, AgentStatus } from '@dragoscatalin/agent-runtime';
import { MemoryGraphEngine } from '@dragoscatalin/memory-graph';
import { MessageBubble } from './MessageBubble';
import { StreamingMessageRenderer } from './StreamingMessageRenderer';
import { AgentStatusIndicator } from './AgentStatusIndicator';
import { ConversationHistory } from './ConversationHistory';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

interface ConversationInterfaceProps {
	agentRuntime: AgentRuntime;
	memoryGraph: MemoryGraphEngine;
	conversationId?: string;
	className?: string;
}

/**
 * Enhanced AI-native conversational interface for AIDE
 * Provides real-time conversation with multiple AI agents
 */
export const ConversationInterface: React.FC<ConversationInterfaceProps> = ({
	agentRuntime,
	memoryGraph,
	conversationId,
	className = '',
}) => {
	const [messages, setMessages] = useState<AgentMessage[]>([]);
	const [inputValue, setInputValue] = useState('');
	const [isProcessing, setIsProcessing] = useState(false);
	const [activeAgents, setActiveAgents] = useState<string[]>([]);
	const [streamingMessage, setStreamingMessage] = useState<{
		agentId: string;
		content: string;
		complete: boolean;
	} | null>(null);
	const [conversationContext, setConversationContext] = useState<ConversationContext | null>(null);
	const [showHistory, setShowHistory] = useState(false);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const conversationIdRef = useRef(conversationId || `conv-${Date.now()}`);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, streamingMessage]);

	// Focus input on mount
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	// Subscribe to agent runtime events
	useEffect(() => {
		const messagesSubscription = agentRuntime.messages$.subscribe((message) => {
			setMessages(prev => [...prev, message]);
		});
		const statusSubscription = agentRuntime.status$.subscribe(({ agentId, status }) => {
			if (status.currentTasks > 0) {
				setActiveAgents(prev => [...prev.filter(id => id !== agentId), agentId]);
			} else {
				setActiveAgents(prev => prev.filter(id => id !== agentId));
			}
		});

		return () => {
			messagesSubscription.unsubscribe();
			statusSubscription.unsubscribe();
		};
	}, [agentRuntime]);

	// Load conversation history
	useEffect(() => {
		const loadConversation = async () => {
			try {
				const context = await agentRuntime.getConversationContext(conversationIdRef.current);
				if (context) {
					setConversationContext(context);
					setMessages(context.messages);
				}
			} catch (error) {
				console.error('Failed to load conversation:', error);
			}
		};

		loadConversation();
	}, [agentRuntime]);

	const handleSendMessage = useCallback(async (content: string) => {
		if (!content.trim() || isProcessing) return;

		setIsProcessing(true);
		setInputValue('');

		try {
			// Create user message
			const userMessage: AgentMessage = {
				id: `msg-${Date.now()}`,
				agentId: 'user',
				type: 'request',
				content: content.trim(),
				timestamp: new Date(),
			};

			setMessages(prev => [...prev, userMessage]);

			// Start conversation with agents
			await agentRuntime.startConversation(conversationIdRef.current, content.trim(), {
				onMessageStream: (agentId: string, chunk: string, complete: boolean) => {
					setStreamingMessage({ agentId, content: chunk, complete });
					if (complete) {
						setStreamingMessage(null);
					}
				},
				onAgentStart: (agentId: string) => {
					setActiveAgents(prev => [...prev.filter(id => id !== agentId), agentId]);
				},
				onAgentComplete: (agentId: string) => {
					setActiveAgents(prev => prev.filter(id => id !== agentId));
				},
			});

		} catch (error) {
			console.error('Failed to send message:', error);

			// Add error message
			const errorMessage: AgentMessage = {
				id: `err-${Date.now()}`,
				agentId: 'system',
				type: 'error',
				content: `Failed to process message: ${error instanceof Error ? error.message : 'Unknown error'}`,
				timestamp: new Date(),
			};

			setMessages(prev => [...prev, errorMessage]);
		} finally {
			setIsProcessing(false);
		}
	}, [agentRuntime, isProcessing]);

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage(inputValue);
		}
	};

	const handleNewConversation = () => {
		conversationIdRef.current = `conv-${Date.now()}`;
		setMessages([]);
		setConversationContext(null);
		setStreamingMessage(null);
		setActiveAgents([]);
		inputRef.current?.focus();
	};

	const getWelcomeMessage = () => {
		if (messages.length === 0) {
			return (
				<div className="flex items-center justify-center h-full">
					<Card className="p-8 max-w-md text-center">
						<div className="mb-4">
							<Bot className="w-12 h-12 mx-auto text-primary" />
						</div>
						<h3 className="text-xl font-semibold mb-2">Welcome to AIDE</h3>
						<p className="text-muted-foreground mb-4">
							Your AI-native development environment. Describe what you'd like to build,
							and I'll coordinate with specialized agents to help you create it.
						</p>
						<div className="text-sm text-muted-foreground space-y-1">
							<p>✨ <strong>Natural Language:</strong> Just describe what you want</p>
							<p>🤖 <strong>Multi-Agent:</strong> Specialized AI agents work together</p>
							<p>🧠 <strong>Memory:</strong> Learns and remembers your preferences</p>
							<p>🚀 <strong>End-to-End:</strong> From idea to deployment</p>
						</div>
					</Card>
				</div>
			);
		}
		return null;
	};

	return (
		<div className={`aide-conversation-interface flex flex-col h-full ${className}`}>
			{/* Header */}
			<div className="border-b border-border p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<h2 className="text-lg font-semibold">AIDE Conversation</h2>						{conversationContext?.currentGoal && (
							<Badge variant="outline">{conversationContext.currentGoal}</Badge>
						)}
					</div>

					<div className="flex items-center space-x-2">
						{/* Active agents indicator */}
						{activeAgents.length > 0 && (
							<div className="flex items-center space-x-1">
								<Zap className="w-4 h-4 text-yellow-500" />
								<span className="text-xs text-muted-foreground">
									{activeAgents.length} agent{activeAgents.length > 1 ? 's' : ''} active
								</span>
							</div>
						)}

						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowHistory(!showHistory)}
						>
							<Archive className="w-4 h-4" />
						</Button>

						<Button
							variant="ghost"
							size="sm"
							onClick={handleNewConversation}
						>
							New Chat
						</Button>
					</div>
				</div>

				{/* Agent status indicators */}
				{activeAgents.length > 0 && (
					<div className="mt-2 flex flex-wrap gap-2">
						{activeAgents.map(agentId => (
							<AgentStatusIndicator
								key={agentId}
								agentId={agentId}
								runtime={agentRuntime}
							/>
						))}
					</div>
				)}
			</div>

			{/* Messages Area */}
			<div className="flex-1 overflow-y-auto">
				{showHistory && (
					<ConversationHistory
						memoryGraph={memoryGraph}
						onConversationSelect={(id) => {
							conversationIdRef.current = id;
							setShowHistory(false);
						}}
					/>
				)}

				<div className="p-4 space-y-4">
					{getWelcomeMessage()}

					{messages.map((message) => (
						<MessageBubble
							key={message.id}
							message={message}
							isUser={message.agentId === 'user'}
							timestamp
							className="animate-in slide-in-from-bottom-2 duration-300"
						/>
					))}

					{/* Streaming message */}
					{streamingMessage && (
						<StreamingMessageRenderer
							agentId={streamingMessage.agentId}
							content={streamingMessage.content}
							complete={streamingMessage.complete}
						/>
					)}

					{/* Processing indicator */}
					{isProcessing && activeAgents.length === 0 && (
						<div className="flex items-center space-x-2 text-muted-foreground">
							<Loader2 className="w-4 h-4 animate-spin" />
							<span>Processing your request...</span>
						</div>
					)}

					<div ref={messagesEndRef} />
				</div>
			</div>

			{/* Input Area */}
			<div className="border-t border-border p-4">
				<div className="flex space-x-3">
					<div className="flex-1">
						<Input
							ref={inputRef}
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyPress={handleKeyPress}
							placeholder="Describe what you'd like to build, or ask a question..."
							disabled={isProcessing}
							className="text-base"
						/>
					</div>
					<Button
						onClick={() => handleSendMessage(inputValue)}
						disabled={!inputValue.trim() || isProcessing}
						size="lg"
						className="px-6"
					>
						{isProcessing ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Send className="w-4 h-4" />
						)}
					</Button>
				</div>

				{/* Input hints */}
				<div className="mt-2 text-xs text-muted-foreground">
					<p>
						💡 Try: "Create a React todo app" • "Add authentication" • "Deploy to Vercel" • "Fix the login bug"
					</p>
				</div>
			</div>
		</div>
	);
};
