import React, { FC, ReactNode, useRef, useEffect } from 'react';

interface PositionedNodeProps {
	x: number;
	y: number;
	nodeId: string;
	nodeType: string;
	isSelected?: boolean;
	children: ReactNode;
}

/**
 * A component that positions a node in a memory graph using CSS variables
 * This approach uses DOM properties to set CSS variables instead of inline styles
 */
export const PositionedNode: FC<PositionedNodeProps> = ({
	x,
	y,
	nodeId,
	nodeType,
	isSelected = false,
	children,
}) => {
	const nodeRef = useRef<HTMLDivElement>(null);

	// Update position using DOM properties instead of inline styles
	useEffect(() => {
		if (nodeRef.current) {
			nodeRef.current.style.setProperty('--node-x', `${x}px`);
			nodeRef.current.style.setProperty('--node-y', `${y}px`);
		}
	}, [x, y]);

	// Set data attributes for semantic meaning
	const dataAttrs = {
		'data-node-id': nodeId,
		'data-node-type': nodeType,
		'data-selected': isSelected ? 'true' : 'false',
	};

	return (
		<div ref={nodeRef} className="memory-graph-node" {...dataAttrs}>
			{children}
		</div>
	);
};
