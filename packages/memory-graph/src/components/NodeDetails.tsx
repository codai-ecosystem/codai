import React from 'react';
import { AnyNode } from '../schemas';

interface NodeDetailsProps {
	node: AnyNode;
	readOnly?: boolean;
	onUpdate?: (updates: Partial<AnyNode>) => void;
}

export const NodeDetails: React.FC<NodeDetailsProps> = ({ node, readOnly = true, onUpdate }) => {
	// Mark unused parameters as intentionally unused
	void readOnly;
	void onUpdate;
	const renderDetails = () => {
		switch (node.type) {
			case 'feature':
				return (
					<>
						<div className="node-details__row">
							<span className="node-details__label">Status</span>
							<span className="node-details__value">{node.status}</span>
						</div>
						<div className="node-details__row">
							<span className="node-details__label">Priority</span>
							<span className="node-details__value">{node.priority}</span>
						</div>
						{node.requirements && node.requirements.length > 0 && (
							<div className="node-details__row">
								<span className="node-details__label">Requirements</span>
								<ul className="node-details__list">
									{node.requirements.map((req, i) => (
										<li key={i}>{req}</li>
									))}
								</ul>
							</div>
						)}
					</>
				);

			case 'screen':
				return (
					<>
						<div className="node-details__row">
							<span className="node-details__label">Type</span>
							<span className="node-details__value">{node.screenType}</span>
						</div>
						{node.route && (
							<div className="node-details__row">
								<span className="node-details__label">Route</span>
								<span className="node-details__value">{node.route}</span>
							</div>
						)}
					</>
				);

			case 'logic':
				return (
					<>
						<div className="node-details__row">
							<span className="node-details__label">Type</span>
							<span className="node-details__value">{node.logicType}</span>
						</div>
						{node.complexity && (
							<div className="node-details__row">
								<span className="node-details__label">Complexity</span>
								<span className="node-details__value">{node.complexity}/10</span>
							</div>
						)}
						{node.testCoverage && (
							<div className="node-details__row">
								<span className="node-details__label">Test Coverage</span>
								<span className="node-details__value">{node.testCoverage}%</span>
							</div>
						)}
					</>
				);

			case 'data':
				return (
					<>
						<div className="node-details__row">
							<span className="node-details__label">Data Type</span>
							<span className="node-details__value">{node.dataType}</span>
						</div>
						<div className="node-details__row">
							<span className="node-details__label">Persisted</span>
							<span className="node-details__value">{node.persistence ? 'Yes' : 'No'}</span>
						</div>
					</>
				);

			default:
				return (
					<div className="node-details__row">
						<span className="node-details__label">Type</span>
						<span className="node-details__value">{node.type}</span>
					</div>
				);
		}
	};

	return (
		<div className="node-details">
			<div className="node-details__header">
				<h3 className="node-details__title">{node.name}</h3>
				<div className="node-details__type">{node.type}</div>
			</div>

			{node.description && <div className="node-details__description">{node.description}</div>}

			<div className="node-details__content">{renderDetails()}</div>

			<div className="node-details__meta">
				<div className="node-details__id">ID: {node.id}</div>
				<div className="node-details__version">v{node.version}</div>
			</div>
		</div>
	);
};
