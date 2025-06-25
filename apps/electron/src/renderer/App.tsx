/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import React, { useState, useEffect } from 'react';
import {
	Layout,
	Header,
	ConversationView,
	MemoryGraphVisualization,
	Sidebar,
	StatusBar,
	Button,
	useMemoryGraph,
} from '@codai/ui-components';
import { ipcRenderer } from 'electron';

// Define the message type matching what AgentRuntime expects
interface Message {
	id: string;
	content: string;
	type: 'request' | 'response' | 'notification' | 'error';
	agentId: string;
	timestamp: Date;
	metadata?: Record<string, unknown>;
	parentMessageId?: string;
}

// Sample nodes for memory graph with proper types
const sampleNodes = [
	{
		id: 'node-1',
		name: 'Project Intent',
		type: 'intent' as const,
		description: 'Build an AI development environment',
		createdAt: new Date(),
		updatedAt: new Date(),
		version: '1.0.0',
		category: 'goal' as const,
		priority: 'high' as const,
		status: 'active' as const,
	},
	{
		id: 'node-2',
		name: 'User Interface',
		type: 'feature' as const,
		description: 'React-based UI with conversation and memory visualization',
		createdAt: new Date(),
		updatedAt: new Date(),
		version: '1.0.0',
		status: 'implemented' as const,
		priority: 'high' as const,
	},
	{
		id: 'node-3',
		name: 'Agent Runtime',
		type: 'feature' as const,
		description: 'Handles agent coordination and task execution',
		createdAt: new Date(),
		updatedAt: new Date(),
		version: '1.0.0',
		status: 'implemented' as const,
		priority: 'high' as const,
	},
	{
		id: 'node-4',
		name: 'Memory Graph',
		type: 'feature' as const,
		description: 'Stores project state and knowledge',
		createdAt: new Date(),
		updatedAt: new Date(),
		version: '1.0.0',
		status: 'implemented' as const,
		priority: 'high' as const,
	},
];

// Sample relationships between nodes with proper types
const sampleRelationships = [
	{
		id: 'rel-1',
		fromNodeId: 'node-1',
		toNodeId: 'node-2',
		type: 'contains' as const,
		strength: 1.0,
		createdAt: new Date(),
	},
	{
		id: 'rel-2',
		fromNodeId: 'node-1',
		toNodeId: 'node-3',
		type: 'contains' as const,
		strength: 1.0,
		createdAt: new Date(),
	},
	{
		id: 'rel-3',
		fromNodeId: 'node-1',
		toNodeId: 'node-4',
		type: 'contains' as const,
		strength: 1.0,
		createdAt: new Date(),
	},
	{
		id: 'rel-4',
		fromNodeId: 'node-3',
		toNodeId: 'node-4',
		type: 'uses' as const,
		strength: 1.0,
		createdAt: new Date(),
	},
];

const App: React.FC = () => {
	// State for application
	const [showGraph, setShowGraph] = useState(false);
	const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined);
	const [isLoading, setIsLoading] = useState(false);
	// Sample conversation for demonstration
	const [messages, setMessages] = useState<Message[]>([
		{
			id: '1',
			content: 'Welcome to AIDE! How can I help you today?',
			type: 'response',
			agentId: 'system',
			timestamp: new Date(),
		},
	]);

	// Listen for messages from the main process
	useEffect(() => {
		const handleToggleGraph = () => {
			setShowGraph(prev => !prev);
		};

		const handleNewConversation = () => {
			setMessages([
				{
					id: Date.now().toString(),
					content: 'Welcome to AIDE! How can I help you today?',
					type: 'response',
					agentId: 'system',
					timestamp: new Date(),
				},
			]);
		};

		const handleClearConversation = () => {
			setMessages([]);
		};

		// Set up IPC listeners
		ipcRenderer.on('toggle-memory-graph', handleToggleGraph);
		ipcRenderer.on('new-conversation', handleNewConversation);
		ipcRenderer.on('clear-conversation', handleClearConversation);

		// Cleanup
		return () => {
			ipcRenderer.removeListener('toggle-memory-graph', handleToggleGraph);
			ipcRenderer.removeListener('new-conversation', handleNewConversation);
			ipcRenderer.removeListener('clear-conversation', handleClearConversation);
		};
	}, []);

	// Handle sending a message
	const handleSendMessage = (content: string) => {
		const userMessage: Message = {
			id: Date.now().toString(),
			content,
			type: 'request',
			agentId: 'user',
			timestamp: new Date(),
		};

		setMessages([...messages, userMessage]);
		setIsLoading(true);

		// Mock assistant response
		setTimeout(() => {
			setIsLoading(false);
			const assistantMessage: Message = {
				id: (Date.now() + 1).toString(),
				content:
					"I received your message and I'm working on implementing this feature. The Electron app is working!",
				type: 'response',
				agentId: 'assistant',
				timestamp: new Date(),
			};
			setMessages(prev => [...prev, assistantMessage]);
		}, 1500);
	};

	// Create header actions
	const headerActions = (
		<>
			<Button onClick={() => setShowGraph(!showGraph)}>
				{showGraph ? 'Hide Graph' : 'Show Graph'}
			</Button>
		</>
	);

	// Create sidebar content
	const sidebarContent = (
		<Sidebar>
			<div className="p-4">
				<h3 className="text-lg font-semibold mb-2">Project</h3>
				<ul className="space-y-2">
					<li>Components</li>
					<li>Resources</li>
					<li>Tasks</li>
				</ul>
			</div>
		</Sidebar>
	);

	// Create status bar content
	const statusBarContent = (
		<StatusBar>
			<div className="flex justify-between px-4 py-1">
				<div>AIDE v1.0.0</div>
				<div>Ready</div>
			</div>
		</StatusBar>
	);

	return (
		<Layout
			header={<Header title="AIDE" subtitle="AI Development Environment" actions={headerActions} />}
			sidebar={sidebarContent}
			statusBar={statusBarContent}
		>
			{' '}
			{showGraph ? (
				<MemoryGraphVisualization
					nodes={sampleNodes}
					relationships={sampleRelationships}
					{...(selectedNodeId && { selectedNodeId })}
					onNodeSelect={id => setSelectedNodeId(id)}
					layout="force"
					className="h-full"
				/>
			) : (
				<ConversationView
					messages={messages}
					onSendMessage={handleSendMessage}
					isLoading={isLoading}
					placeholder="Describe what you'd like to build..."
					className="h-full"
				/>
			)}
		</Layout>
	);
};

export default App;
