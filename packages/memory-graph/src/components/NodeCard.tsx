import React from 'react';
import { AnyNode } from '../schemas';

export interface NodeCardProps {
	node: AnyNode;
	position: { x: number; y: number };
	isSelected: boolean;
	isEditable: boolean;
	onClick: () => void;
	onUpdate: (updates: Partial<AnyNode>) => void;
	className?: string;
	data?: any; // For ReactFlow compatibility
	selected?: boolean; // For ReactFlow compatibility
	id?: string; // For ReactFlow compatibility
}

export const NodeCard: React.FC<NodeCardProps> = ({
	node,
	position,
	isSelected,
	onClick,
	data,
	selected = false,
	className = '',
}) => {
	// If this component is used directly with ReactFlow, use the data prop
	// Otherwise, use the node prop from our own implementation
	const nodeData = data || node;
	const isNodeSelected = selected || isSelected;
	const getNodeColor = (type: string) => {
		switch (type) {
			case 'feature':
				return 'type-feature';
			case 'screen':
				return 'type-screen';
			case 'logic':
				return 'type-logic';
			case 'data':
			case 'data_model':
				return 'type-data';
			case 'api':
				return 'type-api';
			case 'test':
				return 'type-test';
			case 'decision':
				return 'type-decision';
			case 'intent':
				return 'type-intent';
			case 'conversation':
				return 'type-conversation';
			default:
				return 'type-default';
		}
	};
	const getNodeIcon = (type: string) => {
		switch (type) {
			case 'feature':
				return '✨';
			case 'screen':
				return '📱';
			case 'logic':
				return '⚙️';
			case 'data':
			case 'data_model':
				return '💾';
			case 'api':
				return '🔌';
			case 'test':
				return '🧪';
			case 'decision':
				return '🔀';
			case 'intent':
				return '🎯';
			case 'conversation':
				return '💬';
			default:
				return '📄';
		}
	};

	const type = nodeData?.type || 'default';
	const typeClass = getNodeColor(type);
	const icon = getNodeIcon(type);

	return (
		<div
			className={`memory-graph-node ${typeClass} ${className} ${isNodeSelected ? 'selected' : ''}`}
			style={{
				transform: `translate(${position.x}px, ${position.y}px)`,
				position: 'absolute',
				cursor: 'pointer',
				userSelect: 'none',
			}}
			onClick={onClick}
		>
			<div className="memory-graph-node__header">
				<div className="memory-graph-node__icon">{icon}</div>
				<div className="memory-graph-node__title">{nodeData.name}</div>
			</div>
			{nodeData.description && (
				<div className="memory-graph-node__description">{nodeData.description}</div>
			)}
		</div>
	);
};
