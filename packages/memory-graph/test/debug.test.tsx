import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GraphControls } from '../src/components/GraphControls';

describe('Debug GraphControls', () => {
	it('debug rendering', () => {
		const props = {
			onFilterChange: vi.fn(),
			currentFilter: 'data',
			nodeTypes: ['data', 'api', 'processing']
		};

		const { container } = render(<GraphControls {...props} />);

		console.log('=== CONTAINER HTML ===');
		console.log(container.innerHTML);

		console.log('=== FINDING DATA BUTTON ===');
		const dataButton = screen.getByText('Data');
		console.log('Found button:', dataButton);
		console.log('Button className:', dataButton.className);
		console.log('Button outerHTML:', dataButton.outerHTML);
		console.log('Button data-node-type:', dataButton.getAttribute('data-node-type'));

		// This should pass if the component is working
		expect(dataButton).toBeDefined();
	});
});
