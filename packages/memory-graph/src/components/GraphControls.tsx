import React, { useState, useCallback } from 'react';

export interface GraphControlsProps {
	onFilterChange: (type: string | null) => void;
	currentFilter: string | null;
	nodeTypes: string[];
	className?: string;
	nodeTypeIcons?: Record<string, string>;
}

export const GraphControls: React.FC<GraphControlsProps> = ({
	onFilterChange,
	currentFilter,
	nodeTypes,
	className,
	nodeTypeIcons = {}
}) => {
	// Track if the panel is collapsed
	const [collapsed, setCollapsed] = useState(false);

	// Handle toggling the panel
	const togglePanel = useCallback(() => {
		setCollapsed(prev => !prev);
	}, []);

	// Get count of active filters
	const activeFilterCount = currentFilter ? 1 : 0;

	return (
		<div className={`memory-graph-controls ${collapsed ? 'memory-graph-controls--collapsed' : ''} ${className || ''}`}>
			<div className="memory-graph-controls__header">
				<span className="memory-graph-controls__title">Filters {activeFilterCount > 0 && <span className="memory-graph-controls__badge">{activeFilterCount}</span>}</span>
				<button
					className="memory-graph-controls__toggle"
					onClick={togglePanel}
					title={collapsed ? 'Expand filters' : 'Collapse filters'}
				>
					{collapsed ? '↓' : '↑'}
				</button>
			</div>

			{!collapsed && (
				<div className="memory-graph-controls__content">
					<div className="memory-graph-controls__group">
						<button
							className={`memory-graph-controls__button ${!currentFilter ? 'memory-graph-controls__button--active' : ''}`}
							onClick={() => onFilterChange(null)}
							title="Show all node types"
						>
							All
						</button>

						{nodeTypes.map((type) => {
							// Add dynamic active class based on node type
							const activeClass = currentFilter === type ? `memory-graph-controls__button--active memory-graph-controls__button--active-${type}` : '';

							return (
								<button
									key={type}
									className={`memory-graph-controls__button ${activeClass}`}
									onClick={() => onFilterChange(type)}
									title={`Show only ${type} nodes`}
									data-node-type={type}
								>
									<span className="memory-graph-controls__button-icon">
										{nodeTypeIcons[type] || ''}
									</span>
									<span className="memory-graph-controls__button-text">
										{type.charAt(0).toUpperCase() + type.slice(1)}
									</span>
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
};
