/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { vi } from 'vitest';

// Mock electron module - must be at top level before other imports
vi.mock('electron', () => ({
	ipcRenderer: {
		on: vi.fn(),
		removeListener: vi.fn(),
		send: vi.fn(),
	},
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ipcRenderer } from 'electron';

// Mock the UI components
vi.mock('@aide/ui-components', () => ({
	Layout: ({ children, header, sidebar, statusBar }: any) => (
		<div data-testid="layout">
			{header && <div data-testid="header">{header}</div>}
			{sidebar && <div data-testid="sidebar-container">{sidebar}</div>}
			<div data-testid="main">{children}</div>
			{statusBar && <div data-testid="status-bar-container">{statusBar}</div>}
		</div>
	),
	Header: ({ title, subtitle, actions }: any) => (
		<div data-testid="app-header">
			<h1>{title}</h1>
			{subtitle && <span>{subtitle}</span>}
			{actions}
		</div>
	),
	ConversationView: ({ messages, onSendMessage, isLoading, placeholder }: any) => (
		<div data-testid="conversation-view">
			<div data-testid="messages">
				{messages.map((msg: any) => (
					<div key={msg.id} data-testid={`message-${msg.type}`}>
						{msg.content}
					</div>
				))}
			</div>
			{isLoading && <div data-testid="loading">Loading...</div>}
			<input
				data-testid="message-input"
				placeholder={placeholder}
				onKeyDown={e => {
					if (e.key === 'Enter') {
						onSendMessage((e.target as HTMLInputElement).value);
						(e.target as HTMLInputElement).value = '';
					}
				}}
			/>
		</div>
	),
	MemoryGraphVisualization: ({ nodes, relationships, selectedNodeId }: any) => (
		<div data-testid="memory-graph">
			<div data-testid="nodes-count">{nodes.length} nodes</div>
			<div data-testid="relationships-count">{relationships.length} relationships</div>
			{selectedNodeId && <div data-testid="selected-node">{selectedNodeId}</div>}
		</div>
	),
	Sidebar: ({ children }: any) => <div data-testid="sidebar">{children}</div>,
	StatusBar: ({ children }: any) => <div data-testid="status-bar">{children}</div>,
	Button: ({ children, onClick }: any) => (
		<button data-testid="button" onClick={onClick}>
			{children}
		</button>
	),
	useMemoryGraph: () => ({
		state: { nodes: new Map(), selectedNode: null, filters: { types: [], timeRange: null } },
		addNode: vi.fn(),
		removeNode: vi.fn(),
		updateNode: vi.fn(),
		selectNode: vi.fn(),
		setFilters: vi.fn(),
		getConnectedNodes: vi.fn(() => []),
	}),
}));

import App from '../App';

describe('App', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset the mock calls for ipcRenderer
		vi.mocked(ipcRenderer.on).mockClear();
		vi.mocked(ipcRenderer.send).mockClear();
		vi.mocked(ipcRenderer.removeListener).mockClear();
	});
	it('should render layout with header, sidebar, and status bar', () => {
		render(<App />);

		expect(screen.getByTestId('layout')).toBeInTheDocument();
		expect(screen.getByTestId('app-header')).toBeInTheDocument();
		expect(screen.getByText('Project')).toBeInTheDocument(); // Check for sidebar content
		expect(screen.getByText('AIDE v1.0.0')).toBeInTheDocument(); // Check for status bar content
	});

	it('should display welcome message initially', () => {
		render(<App />);

		expect(screen.getByText('Welcome to AIDE! How can I help you today?')).toBeInTheDocument();
	});

	it('should toggle between conversation view and memory graph', () => {
		render(<App />);

		// Initially shows conversation view
		expect(screen.getByTestId('conversation-view')).toBeInTheDocument();
		expect(screen.queryByTestId('memory-graph')).not.toBeInTheDocument();

		// Click toggle button
		const toggleButton = screen.getByTestId('button');
		fireEvent.click(toggleButton);

		// Now shows memory graph
		expect(screen.queryByTestId('conversation-view')).not.toBeInTheDocument();
		expect(screen.getByTestId('memory-graph')).toBeInTheDocument();
	});

	it('should send message when Enter is pressed', async () => {
		render(<App />);

		const input = screen.getByTestId('message-input');
		fireEvent.change(input, { target: { value: 'Hello AIDE' } });
		fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

		// Should add user message
		await waitFor(() => {
			expect(screen.getByText('Hello AIDE')).toBeInTheDocument();
		});

		// Should add assistant response after delay
		await waitFor(
			() => {
				expect(screen.getByText(/I received your message/)).toBeInTheDocument();
			},
			{ timeout: 2000 }
		);
	});

	it('should show loading state when sending message', async () => {
		render(<App />);

		const input = screen.getByTestId('message-input');
		fireEvent.change(input, { target: { value: 'Test message' } });
		fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

		// Should show loading
		await waitFor(() => {
			expect(screen.getByTestId('loading')).toBeInTheDocument();
		});
	});
	it('should handle IPC messages from main process', () => {
		render(<App />);

		// Verify IPC listeners are set up
		expect(ipcRenderer.on).toHaveBeenCalledWith('toggle-memory-graph', expect.any(Function));
		expect(ipcRenderer.on).toHaveBeenCalledWith('new-conversation', expect.any(Function));
		expect(ipcRenderer.on).toHaveBeenCalledWith('clear-conversation', expect.any(Function));
	});

	it('should display memory graph with sample data', () => {
		render(<App />);

		// Toggle to memory graph view
		const toggleButton = screen.getByTestId('button');
		fireEvent.click(toggleButton);

		// Should show nodes and relationships
		expect(screen.getByTestId('nodes-count')).toHaveTextContent('4 nodes');
		expect(screen.getByTestId('relationships-count')).toHaveTextContent('4 relationships');
	});
});
