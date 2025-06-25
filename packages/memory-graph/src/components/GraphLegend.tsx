import React from 'react';

interface GraphLegendProps {
	nodeTypes: Record<string, string>;
	nodeIcons: Record<string, string>;
	className?: string;
}

export const GraphLegend: React.FC<GraphLegendProps> = ({ nodeTypes, nodeIcons, className }) => {
	return (
		<div className={`memory-graph-legend ${className || ''}`}>
			<div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Legend</div>
			{Object.entries(nodeTypes).map(([type, color]) => (
				<div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
					<span style={{ color }}>{nodeIcons[type]}</span>
					<span style={{ textTransform: 'capitalize' }}>{type}</span>
				</div>
			))}
		</div>
	);
};
