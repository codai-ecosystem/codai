// Debug script for GraphControls component
import React from 'react';
import { render, screen } from '@testing-library/react';
import { GraphControls } from './src/components/GraphControls.jsx';

const defaultProps = {
	onFilterChange: () => {},
	currentFilter: 'data',
	nodeTypes: ['data', 'api', 'processing'],
};

// Debug the rendered component
const { container } = render(React.createElement(GraphControls, defaultProps));

console.log('=== DEBUG: GraphControls Rendering ===');
console.log('Container HTML:', container.innerHTML);

// Try to find the data button
try {
	const dataButton = screen.getByText('Data');
	console.log('Data button found:', dataButton);
	console.log('Data button classes:', dataButton.className);
	console.log('Data button data-node-type:', dataButton.getAttribute('data-node-type'));
	console.log(
		'Has active class:',
		dataButton.classList.contains('memory-graph-controls__button--active')
	);
} catch (e) {
	console.log('Error finding data button:', e.message);
}
