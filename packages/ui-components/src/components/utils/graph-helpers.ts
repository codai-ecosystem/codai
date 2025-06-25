/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Creates a CSS transform string for graph zoom and pan
 */
export const createGraphTransform = (zoom: number, panX: number, panY: number): string => {
	return `scale(${zoom}) translate(${panX}px, ${panY}px)`;
};

/**
 * Calculates CSS variables for node positioning
 */
export const createNodePositionVars = (x: number, y: number): Record<string, string> => {
	return {
		'--node-x': `${x}px`,
		'--node-y': `${y}px`,
	};
};

/**
 * Creates CSS custom properties for relationship lines
 */
export const createRelationshipLineVars = (
	x1: number,
	y1: number,
	x2: number,
	y2: number
): Record<string, string> => {
	return {
		'--line-x1': `${x1}px`,
		'--line-y1': `${y1}px`,
		'--line-x2': `${x2}px`,
		'--line-y2': `${y2}px`,
	};
};

/**
 * Generates a CSS class for a relationship type
 */
export const getRelationshipTypeClass = (type: string): string => {
	const classMap: Record<string, string> = {
		depends_on: 'memory-graph-relationship-depends',
		implements: 'memory-graph-relationship-implements',
		extends: 'memory-graph-relationship-extends',
		uses: 'memory-graph-relationship-uses',
		contains: 'memory-graph-relationship-contains',
		configures: 'memory-graph-relationship-configures',
		tests: 'memory-graph-relationship-tests',
		derives_from: 'memory-graph-relationship-derives',
		relates_to: 'memory-graph-relationship-relates',
		influences: 'memory-graph-relationship-influences',
	};

	return classMap[type] || 'memory-graph-relationship-default';
};
