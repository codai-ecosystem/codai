import React from 'react';

interface GraphMetricsProps {
	metrics: {
		nodeCount: number;
		edgeCount: number;
		nodeTypeDistribution?: Record<string, number>;
		complexity?: number;
	};
	className?: string;
}

export const GraphMetrics: React.FC<GraphMetricsProps> = ({ metrics, className }) => {
	return (
		<div className={`memory-graph-metrics ${className || ''}`}>
			<div className="memory-graph-metrics__item">
				<span className="memory-graph-metrics__label">Nodes</span>
				<span className="memory-graph-metrics__value">{metrics.nodeCount}</span>
			</div>

			<div className="memory-graph-metrics__item">
				<span className="memory-graph-metrics__label">Edges</span>
				<span className="memory-graph-metrics__value">{metrics.edgeCount}</span>
			</div>

			{metrics.complexity !== undefined && (
				<div className="memory-graph-metrics__item">
					<span className="memory-graph-metrics__label">Complexity</span>
					<span className="memory-graph-metrics__value">{metrics.complexity.toFixed(1)}</span>
				</div>
			)}
		</div>
	);
};
