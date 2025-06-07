/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { ReactNode } from 'react';
import { AgentMessage, Task, AgentStatus } from '@dragoscatalin/agent-runtime';
import { AnyNode, Relationship } from '@dragoscatalin/memory-graph';

/**
 * Component prop types for AIDE UI components
 */

export interface ConversationViewProps {
	messages: AgentMessage[];
	onSendMessage: (content: string) => void;
	isLoading?: boolean;
	placeholder?: string;
	className?: string;
}

export interface MessageBubbleProps {
	message: AgentMessage;
	isUser?: boolean;
	timestamp?: boolean;
	actions?: ReactNode;
	className?: string;
}

export interface MemoryGraphVisualizationProps {
	nodes: AnyNode[];
	relationships: Relationship[];
	selectedNodeId?: string;
	onNodeSelect?: (nodeId: string) => void;
	onNodeEdit?: (nodeId: string, updates: Partial<AnyNode>) => void;
	layout?: 'force' | 'hierarchical' | 'circular';
	className?: string;
}

export interface NodeCardProps {
	node: AnyNode;
	metadata?: {
		relationshipCount?: number;
	};
	isSelected?: boolean;
	isEditable?: boolean;
	onSelect?: () => void;
	onEdit?: (updates: Partial<AnyNode>) => void;
	onDelete?: () => void;
	className?: string;
}

export interface PreviewPanelProps {
	projectId?: string;
	selectedNodeId?: string;
	previewMode?: 'design' | 'code' | 'runtime';
	onModeChange?: (mode: string) => void;
	className?: string;
}

export interface TimelineViewProps {
	events: TimelineEvent[];
	selectedEventId?: string;
	onEventSelect?: (eventId: string) => void;
	className?: string;
}

export interface TaskStatusProps {
	task: Task;
	showProgress?: boolean;
	showActions?: boolean;
	onCancel?: () => void;
	onRetry?: () => void;
	className?: string;
}

export interface AgentIndicatorProps {
	agent: AgentStatus;
	size?: 'sm' | 'md' | 'lg';
	showMetrics?: boolean;
	className?: string;
}

export interface TimelineEvent {
	id: string;
	type: 'task' | 'message' | 'change' | 'deployment';
	title: string;
	description?: string;
	timestamp: Date;
	agentId?: string;
	nodeId?: string;
	metadata?: Record<string, unknown>;
}
