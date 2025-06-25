import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import { GraphControls } from '../../src/components/GraphControls';

describe('GraphControls Component', () => {
	const defaultProps = {
		onFilterChange: vi.fn(),
		currentFilter: null,
		nodeTypes: ['data', 'api', 'processing'],
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('renders filter controls', () => {
			render(<GraphControls {...defaultProps} />);

			expect(screen.getByText('Filters')).toBeDefined();
			expect(screen.getByText('All')).toBeDefined();
		});

		it('renders node type filters', () => {
			render(<GraphControls {...defaultProps} />);

			expect(screen.getByText('Data')).toBeDefined();
			expect(screen.getByText('Api')).toBeDefined();
			expect(screen.getByText('Processing')).toBeDefined();
		});

		it('shows active filter count when filter is applied', () => {
			render(<GraphControls {...defaultProps} currentFilter="data" />);

			expect(screen.getByText('1')).toBeDefined();
		});
		it('applies custom className', () => {
			const { container } = render(<GraphControls {...defaultProps} className="custom-controls" />);

			expect((container.firstChild as HTMLElement)?.classList.contains('custom-controls')).toBe(
				true
			);
		});
	});

	describe('Filter Functionality', () => {
		it('calls onFilterChange when All button is clicked', async () => {
			const onFilterChange = vi.fn();
			render(<GraphControls {...defaultProps} onFilterChange={onFilterChange} />);

			const allButton = screen.getByText('All');
			await fireEvent.click(allButton);

			expect(onFilterChange).toHaveBeenCalledWith(null);
		});
		it('calls onFilterChange when node type button is clicked', async () => {
			const onFilterChange = vi.fn();
			render(<GraphControls {...defaultProps} onFilterChange={onFilterChange} />);

			const dataButton = screen.getByTitle('Show only data nodes');
			await fireEvent.click(dataButton);

			expect(onFilterChange).toHaveBeenCalledWith('data');
		});
		it('shows active state for current filter', () => {
			render(<GraphControls {...defaultProps} currentFilter="data" />);

			const dataButton = screen.getByTitle('Show only data nodes');
			expect(dataButton.classList.contains('memory-graph-controls__button--active')).toBe(true);
		});

		it('shows active state for All button when no filter is applied', () => {
			render(<GraphControls {...defaultProps} currentFilter={null} />);

			const allButton = screen.getByText('All');
			expect(allButton.classList.contains('memory-graph-controls__button--active')).toBe(true);
		});
	});

	describe('Collapsible Panel', () => {
		it('can be collapsed and expanded', async () => {
			render(<GraphControls {...defaultProps} />);

			const toggleButton = screen.getByTitle('Collapse filters');
			await fireEvent.click(toggleButton);

			// After collapse, content should be hidden
			expect(screen.queryByText('All')).toBeNull();

			// Button text should change
			expect(screen.getByTitle('Expand filters')).toBeDefined();
		});

		it('starts expanded by default', () => {
			render(<GraphControls {...defaultProps} />);

			expect(screen.getByText('All')).toBeDefined();
			expect(screen.getByTitle('Collapse filters')).toBeDefined();
		});
	});

	describe('Node Type Icons', () => {
		it('displays icons when provided', () => {
			const nodeTypeIcons = {
				data: '📊',
				api: '🔌',
				processing: '⚙️',
			};

			render(<GraphControls {...defaultProps} nodeTypeIcons={nodeTypeIcons} />);

			expect(screen.getByText('📊')).toBeDefined();
			expect(screen.getByText('🔌')).toBeDefined();
			expect(screen.getByText('⚙️')).toBeDefined();
		});

		it('works without icons', () => {
			render(<GraphControls {...defaultProps} />);

			// Should still render node type buttons without icons
			expect(screen.getByText('Data')).toBeDefined();
			expect(screen.getByText('Api')).toBeDefined();
			expect(screen.getByText('Processing')).toBeDefined();
		});
	});

	describe('Accessibility', () => {
		it('provides appropriate button titles', () => {
			render(<GraphControls {...defaultProps} />);

			expect(screen.getByTitle('Show all node types')).toBeDefined();
			expect(screen.getByTitle('Show only data nodes')).toBeDefined();
			expect(screen.getByTitle('Show only api nodes')).toBeDefined();
			expect(screen.getByTitle('Show only processing nodes')).toBeDefined();
		});
		it('includes data attributes for node type buttons', () => {
			render(<GraphControls {...defaultProps} />);

			const dataButton = screen.getByTitle('Show only data nodes');
			expect(dataButton.getAttribute('data-node-type')).toBe('data');

			const apiButton = screen.getByTitle('Show only api nodes');
			expect(apiButton.getAttribute('data-node-type')).toBe('api');
		});
	});
});
