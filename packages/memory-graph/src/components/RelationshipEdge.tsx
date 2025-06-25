import React from 'react';
import { Relationship } from '../schemas';

export interface RelationshipEdgeProps {
	edge: Relationship;
	fromPosition: { x: number; y: number };
	toPosition: { x: number; y: number };
	isSelected: boolean;
	onDelete?: () => void;
}

export const RelationshipEdge: React.FC<RelationshipEdgeProps> = ({
	edge,
	fromPosition,
	toPosition,
	isSelected,
	onDelete,
}) => {
	const getEdgeColor = (type: string) => {
		switch (type) {
			case 'contains':
				return '#3B82F6';
			case 'depends_on':
				return '#EF4444';
			case 'implements':
				return '#10B981';
			case 'extends':
				return '#8B5CF6';
			case 'uses':
				return '#F59E0B';
			case 'configures':
				return '#6B7280';
			case 'tests':
				return '#EC4899';
			default:
				return '#6B7280';
		}
	};

	const strokeWidth = isSelected ? 3 : 2;
	const strokeColor = getEdgeColor(edge.type);
	// Calculate arrow position
	const dx = toPosition.x - fromPosition.x;
	const dy = toPosition.y - fromPosition.y;
	const angle = Math.atan2(dy, dx);

	// Offset start and end points to avoid overlapping with nodes
	const nodeRadius = 75; // Half of node width/height
	const startX = fromPosition.x + Math.cos(angle) * nodeRadius;
	const startY = fromPosition.y + Math.sin(angle) * nodeRadius;
	const endX = toPosition.x - Math.cos(angle) * nodeRadius;
	const endY = toPosition.y - Math.sin(angle) * nodeRadius;

	// Arrow head
	const arrowSize = 8;
	const arrowX1 = endX - arrowSize * Math.cos(angle - Math.PI / 6);
	const arrowY1 = endY - arrowSize * Math.sin(angle - Math.PI / 6);
	const arrowX2 = endX - arrowSize * Math.cos(angle + Math.PI / 6);
	const arrowY2 = endY - arrowSize * Math.sin(angle + Math.PI / 6);

	return (
		<g className={`relationship-edge ${isSelected ? 'selected' : ''}`}>
			{/* Main line */}
			<line
				x1={startX}
				y1={startY}
				x2={endX}
				y2={endY}
				stroke={strokeColor}
				strokeWidth={strokeWidth}
				strokeDasharray={edge.type === 'depends_on' ? '5,5' : 'none'}
			/>

			{/* Arrow head */}
			<polygon
				points={`${endX},${endY} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`}
				fill={strokeColor}
			/>

			{/* Label */}
			<text
				x={(startX + endX) / 2}
				y={(startY + endY) / 2 - 5}
				textAnchor="middle"
				className="text-xs fill-gray-600"
				fontSize="10"
			>
				{edge.type}
			</text>

			{/* Delete button for selected edge */}
			{isSelected && onDelete && (
				<circle
					cx={(startX + endX) / 2}
					cy={(startY + endY) / 2 + 10}
					r="8"
					fill="red"
					className="cursor-pointer"
					onClick={onDelete}
				/>
			)}
		</g>
	);
};
