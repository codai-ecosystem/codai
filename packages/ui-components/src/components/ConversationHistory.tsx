import React, { useState, useEffect } from 'react';
import { Clock, MessageSquare, Archive, Search, Filter } from 'lucide-react';
import { MemoryGraphEngine, AnyNode } from '@dragoscatalin/memory-graph';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';

interface ConversationHistoryProps {
	memoryGraph: MemoryGraphEngine;
	onConversationSelect: (conversationId: string) => void;
	className?: string;
}

interface ConversationSummary {
	id: string;
	title: string;
	lastMessage: string;
	timestamp: Date;
	messageCount: number;
	tags: string[];
}

/**
 * Displays conversation history and allows selecting previous conversations
 */
export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
	memoryGraph,
	onConversationSelect,
	className = '',
}) => {
	const [conversations, setConversations] = useState<ConversationSummary[]>([]);
	const [filteredConversations, setFilteredConversations] = useState<ConversationSummary[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadConversationHistory();
	}, [memoryGraph]);

	useEffect(() => {
		filterConversations();
	}, [conversations, searchQuery, selectedFilter]);

	const loadConversationHistory = async () => {
		try {
			setIsLoading(true);

			// Query memory graph for conversation nodes
			const conversationNodes = memoryGraph.getNodesByType('conversation');

			const summaries: ConversationSummary[] = await Promise.all(
				conversationNodes.map(async node => {
					const metadata = node.metadata || {};
					const messageNodes = memoryGraph
						.getNodesByType('message')
						.filter(msgNode => msgNode.metadata?.conversationId === node.id);
					return {
						id: node.id,
						title: (metadata.title as string) || 'Untitled Conversation',
						lastMessage: (metadata.lastMessage as string) || 'No messages',
						timestamp: new Date((metadata.lastActivity as string) || node.createdAt),
						messageCount: messageNodes.length,
						tags: (metadata.tags as string[]) || [],
					};
				})
			);

			// Sort by most recent
			summaries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

			setConversations(summaries);
		} catch (error) {
			console.error('Failed to load conversation history:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const filterConversations = () => {
		let filtered = [...conversations];

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				conv =>
					conv.title.toLowerCase().includes(query) ||
					conv.lastMessage.toLowerCase().includes(query) ||
					conv.tags.some(tag => tag.toLowerCase().includes(query))
			);
		}

		// Apply time filter
		const now = new Date();
		switch (selectedFilter) {
			case 'today':
				filtered = filtered.filter(conv => {
					const diffTime = now.getTime() - conv.timestamp.getTime();
					return diffTime < 24 * 60 * 60 * 1000; // 24 hours
				});
				break;
			case 'week':
				filtered = filtered.filter(conv => {
					const diffTime = now.getTime() - conv.timestamp.getTime();
					return diffTime < 7 * 24 * 60 * 60 * 1000; // 7 days
				});
				break;
			case 'month':
				filtered = filtered.filter(conv => {
					const diffTime = now.getTime() - conv.timestamp.getTime();
					return diffTime < 30 * 24 * 60 * 60 * 1000; // 30 days
				});
				break;
		}

		setFilteredConversations(filtered);
	};

	const formatTimestamp = (date: Date) => {
		const now = new Date();
		const diffTime = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));

		if (diffDays === 0) {
			return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		} else if (diffDays === 1) {
			return 'Yesterday';
		} else if (diffDays < 7) {
			return `${diffDays} days ago`;
		} else {
			return date.toLocaleDateString();
		}
	};

	if (isLoading) {
		return (
			<div className={`p-4 ${className}`}>
				<div className="flex items-center justify-center h-32">
					<div className="text-muted-foreground">Loading conversation history...</div>
				</div>
			</div>
		);
	}

	return (
		<div className={`p-4 border-b border-border ${className}`}>
			<div className="space-y-4">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<Archive className="w-5 h-5" />
						<h3 className="font-semibold">Conversation History</h3>
						<Badge variant="secondary">{conversations.length}</Badge>
					</div>
				</div>

				{/* Search and Filter */}
				<div className="flex space-x-2">
					{' '}
					<div className="flex-1 relative">
						<Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
						<Input
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							placeholder="Search conversations..."
							className="text-sm pl-10"
						/>
					</div>
					<select
						value={selectedFilter}
						onChange={e => setSelectedFilter(e.target.value as any)}
						className="px-3 py-1 text-sm border border-border rounded-md bg-background"
						aria-label="Filter conversations by time period"
					>
						<option value="all">All Time</option>
						<option value="today">Today</option>
						<option value="week">This Week</option>
						<option value="month">This Month</option>
					</select>
				</div>

				{/* Conversation List */}
				<div className="space-y-2 max-h-80 overflow-y-auto">
					{filteredConversations.length === 0 ? (
						<div className="text-center text-muted-foreground py-8">
							{searchQuery ? 'No conversations match your search' : 'No conversations found'}
						</div>
					) : (
						filteredConversations.map(conversation => (
							<div
								key={conversation.id}
								className="p-3 cursor-pointer hover:bg-muted/50 transition-colors border border-border rounded-lg"
								onClick={() => onConversationSelect(conversation.id)}
							>
								<div className="space-y-2">
									<div className="flex items-start justify-between">
										<h4 className="font-medium text-sm truncate flex-1">{conversation.title}</h4>
										<div className="flex items-center space-x-1 text-xs text-muted-foreground ml-2">
											<Clock className="w-3 h-3" />
											<span>{formatTimestamp(conversation.timestamp)}</span>
										</div>
									</div>
									<p className="text-xs text-muted-foreground line-clamp-2">
										{conversation.lastMessage}
									</p>
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-1 text-xs text-muted-foreground">
											<MessageSquare className="w-3 h-3" />
											<span>{conversation.messageCount} messages</span>
										</div>

										{conversation.tags.length > 0 && (
											<div className="flex space-x-1">
												{conversation.tags.slice(0, 2).map((tag, index) => (
													<Badge key={index} variant="outline" className="text-xs">
														{tag}
													</Badge>
												))}
												{conversation.tags.length > 2 && (
													<Badge variant="outline" className="text-xs">
														+{conversation.tags.length - 2}
													</Badge>
												)}
											</div>
										)}
									</div>{' '}
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
};
