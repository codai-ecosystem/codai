import React from 'react';
import { Relationship } from '../schemas';

interface EdgeDetailsProps {
	relationship: Relationship;
	readOnly?: boolean;
	onUpdate?: (updates: Partial<Relationship>) => void;
}

export const EdgeDetails: React.FC<EdgeDetailsProps> = ({
	relationship,
	readOnly = true,
	onUpdate
}) => {
	// Mark unused parameters as intentionally unused
	void readOnly;
	void onUpdate;
	const getRelationshipTypeDescription = (type: string): string => {
		switch (type) {
			case 'contains':
				return 'Parent-child hierarchy relationship';
			case 'depends_on':
				return 'Dependency relationship';
			case 'implements':
				return 'Implementation of a feature or interface';
			case 'extends':
				return 'Extension or inheritance';
			case 'uses':
				return 'Usage relationship';
			case 'configures':
				return 'Configuration relationship';
			case 'tests':
				return 'Test coverage relationship';
			case 'derives_from':
				return 'Derived or generated from';
			case 'relates_to':
				return 'General relation';
			case 'influences':
				return 'One node influences another';
			default:
				return 'Unknown relationship type';
		}
	};

	return (
		<div className="edge-details">
			<div className="edge-details__header">
				<h3 className="edge-details__title">
					{relationship.type.replace('_', ' ')}
				</h3>
				<div className="edge-details__type-description">
					{getRelationshipTypeDescription(relationship.type)}
				</div>
			</div>

			<div className="edge-details__content">
				<div className="edge-details__row">
					<span className="edge-details__label">From</span>
					<span className="edge-details__value">{relationship.fromNodeId}</span>
				</div>

				<div className="edge-details__row">
					<span className="edge-details__label">To</span>
					<span className="edge-details__value">{relationship.toNodeId}</span>
				</div>

				{relationship.strength !== undefined && (
					<div className="edge-details__row">
						<span className="edge-details__label">Strength</span>
						<span className="edge-details__value">{(relationship.strength * 100).toFixed(0)}%</span>
					</div>
				)}
			</div>

			{relationship.metadata && Object.keys(relationship.metadata).length > 0 && (
				<div className="edge-details__metadata">
					<h4 className="edge-details__metadata-title">Metadata</h4>
					{Object.entries(relationship.metadata).map(([key, value]) => (
						<div key={key} className="edge-details__row">
							<span className="edge-details__label">{key}</span>
							<span className="edge-details__value">
								{typeof value === 'object' ? JSON.stringify(value) : String(value)}
							</span>
						</div>
					))}
				</div>
			)}

			<div className="edge-details__meta">
				<div className="edge-details__id">ID: {relationship.id}</div>
				<div className="edge-details__created">
					Created: {relationship.createdAt?.toLocaleDateString()}
				</div>
			</div>
		</div>
	);
};
