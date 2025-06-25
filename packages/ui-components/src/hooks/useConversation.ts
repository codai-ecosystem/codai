import { useState, useCallback } from 'react';

export interface Message {
	id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: Date;
	metadata?: {
		toolCalls?: any[];
		citations?: string[];
		error?: string;
	};
}

export interface ConversationState {
	messages: Message[];
	isLoading: boolean;
	error: string | null;
}

export interface UseConversationReturn {
	state: ConversationState;
	addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string;
	updateMessage: (id: string, updates: Partial<Message>) => void;
	removeMessage: (id: string) => void;
	clearConversation: () => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	getLastMessage: () => Message | undefined;
	getMessagesByRole: (role: Message['role']) => Message[];
}

export function useConversation(): UseConversationReturn {
	const [state, setState] = useState<ConversationState>({
		messages: [],
		isLoading: false,
		error: null,
	});

	const addMessage = useCallback((messageData: Omit<Message, 'id' | 'timestamp'>) => {
		const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const message: Message = {
			...messageData,
			id,
			timestamp: new Date(),
		};

		setState(prev => ({
			...prev,
			messages: [...prev.messages, message],
		}));

		return id;
	}, []);

	const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
		setState(prev => ({
			...prev,
			messages: prev.messages.map(msg => (msg.id === id ? { ...msg, ...updates } : msg)),
		}));
	}, []);

	const removeMessage = useCallback((id: string) => {
		setState(prev => ({
			...prev,
			messages: prev.messages.filter(msg => msg.id !== id),
		}));
	}, []);

	const clearConversation = useCallback(() => {
		setState(prev => ({
			...prev,
			messages: [],
		}));
	}, []);

	const setLoading = useCallback((loading: boolean) => {
		setState(prev => ({
			...prev,
			isLoading: loading,
		}));
	}, []);

	const setError = useCallback((error: string | null) => {
		setState(prev => ({
			...prev,
			error,
		}));
	}, []);

	const getLastMessage = useCallback(() => {
		return state.messages[state.messages.length - 1];
	}, [state.messages]);

	const getMessagesByRole = useCallback(
		(role: Message['role']) => {
			return state.messages.filter(msg => msg.role === role);
		},
		[state.messages]
	);

	return {
		state,
		addMessage,
		updateMessage,
		removeMessage,
		clearConversation,
		setLoading,
		setError,
		getLastMessage,
		getMessagesByRole,
	};
}
