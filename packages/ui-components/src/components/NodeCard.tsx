import React from 'react';
import { Edit2, Trash2, ExternalLink, Calendar } from 'lucide-react';
import { AnyNode } from '@codai/memory-graph';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { NodeCardProps } from '../types';
import './styles/NodeCard.css';

/**
 * Card component for displaying individual memory graph nodes
 */
export const NodeCard: React.FC<NodeCardProps> = ({
	node,
	metadata,
	isSelected = false,
	isEditable = false,
	onSelect,
	onEdit,
	onDelete,
	className = '',
}) => {
	const getNodeTypeColor = (type: string) => {
		const colors: Record<string, string> = {
			feature: 'bg-blue-100 text-blue-800',
			screen: 'bg-purple-100 text-purple-800',
			logic: 'bg-green-100 text-green-800',
			data: 'bg-yellow-100 text-yellow-800',
			api: 'bg-orange-100 text-orange-800',
			test: 'bg-red-100 text-red-800',
			decision: 'bg-indigo-100 text-indigo-800',
			intent: 'bg-emerald-100 text-emerald-800',
			conversation: 'bg-pink-100 text-pink-800',
		};
		return colors[type] || 'bg-gray-100 text-gray-800';
	};

	const getNodeIcon = (type: string) => {
		const icons: Record<string, string> = {
			feature: '✨',
			screen: '📱',
			logic: '🧩',
			data: '💾',
			api: '🌐',
			test: '🧪',
			decision: '🤔',
			intent: '🎯',
			conversation: '💬',
		};
		return icons[type] || '📄';
	};

	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		}).format(date);
	};

	return (<div
		className={`aide-node-card ${isSelected ? 'aide-node-selected' : ''} ${className}`}
		onClick={onSelect}
		role="button"
		tabIndex={0}
		data-selected={isSelected ? 'true' : 'false'}
		onKeyDown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				onSelect?.();
			}
		}}
	>
		{/* Header */}
		<div className="flex items-start justify-between mb-3">
			<div className="flex items-start space-x-2">
				<span className="text-lg" role="img" aria-label={`${node.type} icon`}>{getNodeIcon(node.type)}</span>
				<div className="flex-1">
					<h3 className="font-semibold text-sm line-clamp-2">{node.name}</h3>
					<Badge className={`text-xs ${getNodeTypeColor(node.type)}`}>
						{node.type}
					</Badge>
				</div>
			</div>
		</div>

		{/* Description */}
		{node.description && (
			<p className="text-xs text-muted-foreground mb-3 line-clamp-2">
				{node.description}
			</p>
		)}

		{/* Metadata */}
		<div className="space-y-2 mb-3">
			{/* Status - checking for status in various places */}
			{(node.metadata?.status ||
				('status' in node && node.status)) && (
					<div className="flex items-center space-x-2 text-xs">
						<span className="font-medium">Status:</span>
						<Badge variant="outline">
							{(node.metadata?.status as string) ||
								('status' in node && typeof node.status === 'string' ? node.status : '')}
						</Badge>
					</div>
				)}

			{/* Priority - checking for priority in various places */}
			{(node.metadata?.priority ||
				('priority' in node && node.priority)) && (
					<div className="flex items-center space-x-2 text-xs">
						<span className="font-medium">Priority:</span>
						<Badge
							variant="outline"
							className={
								(node.metadata?.priority === 'high' || ('priority' in node && node.priority === 'high')) ? 'border-red-300 text-red-700' :
									(node.metadata?.priority === 'medium' || ('priority' in node && node.priority === 'medium')) ? 'border-yellow-300 text-yellow-700' :
										'border-green-300 text-green-700'
							}
						>
							{(node.metadata?.priority as string) ||
								('priority' in node && typeof node.priority === 'string' ? node.priority : '')}
						</Badge>
					</div>
				)}

			{/* Relationship count from metadata */}
			{metadata && metadata.relationshipCount !== undefined && metadata.relationshipCount > 0 && (
				<div className="text-xs">
					<span className="font-medium">Relationships:</span>
					<span className="ml-1 text-muted-foreground">
						{metadata.relationshipCount} connection{metadata.relationshipCount !== 1 ? 's' : ''}
					</span>
				</div>
			)}
		</div>

		{/* Footer */}
		<div className="flex items-center justify-between pt-2 border-t border-border">
			<div className="flex items-center space-x-2 text-xs text-muted-foreground">
				<Calendar className="w-3 h-3" />
				<span>{formatDate(node.createdAt)}</span>
			</div>

			{/* Actions */}
			<div className="flex items-center space-x-1">
				{isEditable && (
					<>
						<Button
							size="sm"
							variant="ghost"
							onClick={(e) => {
								e.stopPropagation();
								onEdit?.({});
							}}
							aria-label="Edit node"
						>
							<Edit2 className="w-3 h-3" />
						</Button>
						{onDelete && (
							<Button
								size="sm"
								variant="ghost"
								onClick={(e) => {
									e.stopPropagation();
									onDelete();
								}}
								aria-label="Delete node"
							>
								<Trash2 className="w-3 h-3" />
							</Button>
						)}
					</>
				)}
				<Button
					size="sm"
					variant="ghost"
					onClick={(e) => {
						e.stopPropagation();
						// Could open detailed view
					}}
					aria-label="View node details"
				>
					<ExternalLink className="w-3 h-3" />
				</Button>
			</div>
		</div>
	</div>
	);
};
