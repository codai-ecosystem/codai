import React, { FC, ReactNode, useRef, useEffect } from 'react';

interface TransformedContainerProps {
	zoom: number;
	panX: number;
	panY: number;
	onMouseDown?: React.MouseEventHandler<HTMLDivElement>;
	onMouseMove?: React.MouseEventHandler<HTMLDivElement>;
	onMouseUp?: React.MouseEventHandler<HTMLDivElement>;
	onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
	onWheel?: React.WheelEventHandler<HTMLDivElement>;
	className?: string;
	children: ReactNode;
}

/**
 * A container component that applies transform using CSS variables
 * This approach uses DOM properties to set CSS variables instead of inline styles
 */
export const TransformedContainer: FC<TransformedContainerProps> = ({
	zoom,
	panX,
	panY,
	onMouseDown,
	onMouseMove,
	onMouseUp,
	onMouseLeave,
	onWheel,
	className = '',
	children
}) => {
	const containerRef = useRef<HTMLDivElement>(null);

	// Update transform using DOM properties instead of inline styles
	useEffect(() => {
		if (containerRef.current) {
			containerRef.current.style.setProperty('--graph-transform', `scale(${zoom}) translate(${panX}px, ${panY}px)`);
		}
	}, [zoom, panX, panY]);

	return (
		<div
			ref={containerRef}
			className={`memory-graph-container zoomed ${className}`}
			onMouseDown={onMouseDown}
			onMouseMove={onMouseMove}
			onMouseUp={onMouseUp}
			onMouseLeave={onMouseLeave}
			onWheel={onWheel}
			tabIndex={0}
		>
			{children}
		</div>
	);
};
