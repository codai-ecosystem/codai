import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import { GraphControls } from '../../src/components/GraphControls';

describe('GraphControls Component', () => {
	const defaultProps = {
		layout: 'force' as const,
		onLayoutChange: vi.fn(),
		zoomLevel: 1,
		onZoomChange: vi.fn(),
		onPanReset: vi.fn(),
		isLayouting: false
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('renders all control elements', () => {
			render(<GraphControls {...defaultProps} />);

			expect(screen.getByText('Layout')).toBeInTheDocument();
			expect(screen.getByText('Zoom')).toBeInTheDocument();
			expect(screen.getByText('Reset View')).toBeInTheDocument();
		});

		it('displays current layout type', () => {
			render(<GraphControls {...defaultProps} layout="hierarchical" />);

			expect(screen.getByText('hierarchical')).toBeInTheDocument();
		});

		it('displays current zoom percentage', () => {
			render(<GraphControls {...defaultProps} zoomLevel={1.5} />);

			expect(screen.getByText('150%')).toBeInTheDocument();
		});

		it('applies custom className', () => {
			const { container } = render(
				<GraphControls {...defaultProps} className="custom-controls" />
			);

			expect(container.firstChild).toHaveClass('custom-controls');
		});
	});

	describe('Layout Controls', () => {
		it('calls onLayoutChange when layout button is clicked', async () => {
			const user = userEvent.setup();
			const onLayoutChange = vi.fn();

			render(
				<GraphControls
					{...defaultProps}
					onLayoutChange={onLayoutChange}
				/>
			);

			await user.click(screen.getByText('force'));

			expect(onLayoutChange).toHaveBeenCalledTimes(1);
		});

		it('shows "Layouting..." when isLayouting is true', () => {
			render(<GraphControls {...defaultProps} isLayouting={true} />);

			expect(screen.getByText('Layouting...')).toBeInTheDocument();
		});

		it('disables layout button when layouting', () => {
			render(<GraphControls {...defaultProps} isLayouting={true} />);

			const layoutButton = screen.getByText('Layouting...');
			expect(layoutButton).toBeDisabled();
		});

		it('displays different layout types correctly', () => {
			const { rerender } = render(<GraphControls {...defaultProps} layout="force" />);
			expect(screen.getByText('force')).toBeInTheDocument();

			rerender(<GraphControls {...defaultProps} layout="hierarchical" />);
			expect(screen.getByText('hierarchical')).toBeInTheDocument();

			rerender(<GraphControls {...defaultProps} layout="circular" />);
			expect(screen.getByText('circular')).toBeInTheDocument();
		});
	});

	describe('Zoom Controls', () => {
		it('calls onZoomChange with decreased value when zoom out is clicked', async () => {
			const user = userEvent.setup();
			const onZoomChange = vi.fn();

			render(
				<GraphControls
					{...defaultProps}
					zoomLevel={1}
					onZoomChange={onZoomChange}
				/>
			);

			await user.click(screen.getByText('-'));

			expect(onZoomChange).toHaveBeenCalledWith(0.9);
		});

		it('calls onZoomChange with increased value when zoom in is clicked', async () => {
			const user = userEvent.setup();
			const onZoomChange = vi.fn();

			render(
				<GraphControls
					{...defaultProps}
					zoomLevel={1}
					onZoomChange={onZoomChange}
				/>
			);

			await user.click(screen.getByText('+'));

			expect(onZoomChange).toHaveBeenCalledWith(1.1);
		});

		it('respects minimum zoom level (0.1)', async () => {
			const user = userEvent.setup();
			const onZoomChange = vi.fn();

			render(
				<GraphControls
					{...defaultProps}
					zoomLevel={0.1}
					onZoomChange={onZoomChange}
				/>
			);

			await user.click(screen.getByText('-'));

			expect(onZoomChange).toHaveBeenCalledWith(0.1);
		});

		it('respects maximum zoom level (3.0)', async () => {
			const user = userEvent.setup();
			const onZoomChange = vi.fn();

			render(
				<GraphControls
					{...defaultProps}
					zoomLevel={3}
					onZoomChange={onZoomChange}
				/>
			);

			await user.click(screen.getByText('+'));

			expect(onZoomChange).toHaveBeenCalledWith(3);
		});

		it('displays zoom percentage correctly for various levels', () => {
			const testCases = [
				{ zoom: 0.5, expected: '50%' },
				{ zoom: 1, expected: '100%' },
				{ zoom: 1.25, expected: '125%' },
				{ zoom: 2.5, expected: '250%' }
			];

			testCases.forEach(({ zoom, expected }) => {
				const { rerender } = render(
					<GraphControls {...defaultProps} zoomLevel={zoom} />
				);
				expect(screen.getByText(expected)).toBeInTheDocument();
				rerender(<div />); // Clear between tests
			});
		});

		it('rounds zoom percentage to nearest integer', () => {
			render(<GraphControls {...defaultProps} zoomLevel={1.237} />);

			expect(screen.getByText('124%')).toBeInTheDocument();
		});
	});

	describe('Pan Reset', () => {
		it('calls onPanReset when reset button is clicked', async () => {
			const user = userEvent.setup();
			const onPanReset = vi.fn();

			render(
				<GraphControls
					{...defaultProps}
					onPanReset={onPanReset}
				/>
			);

			await user.click(screen.getByText('Reset View'));

			expect(onPanReset).toHaveBeenCalledTimes(1);
		});

		it('has correct styling for reset button', () => {
			render(<GraphControls {...defaultProps} />);

			const resetButton = screen.getByText('Reset View');
			expect(resetButton).toHaveClass('bg-blue-100');
			expect(resetButton).toHaveClass('text-blue-700');
		});
	});

	describe('Interaction and Accessibility', () => {
		it('provides proper button roles for interactive elements', () => {
			render(<GraphControls {...defaultProps} />);

			const buttons = screen.getAllByRole('button');
			expect(buttons).toHaveLength(4); // Layout, zoom-, zoom+, reset
		});

		it('supports keyboard navigation', async () => {
			const user = userEvent.setup();
			const onZoomChange = vi.fn();

			render(
				<GraphControls
					{...defaultProps}
					onZoomChange={onZoomChange}
				/>
			);

			const zoomInButton = screen.getByText('+');
			zoomInButton.focus();
			await user.keyboard('{Enter}');

			expect(onZoomChange).toHaveBeenCalledWith(1.1);
		});

		it('has hover states for buttons', () => {
			render(<GraphControls {...defaultProps} />);

			const zoomInButton = screen.getByText('+');
			expect(zoomInButton).toHaveClass('hover:bg-gray-200');

			const resetButton = screen.getByText('Reset View');
			expect(resetButton).toHaveClass('hover:bg-blue-200');
		});
	});

	describe('Layout States', () => {
		it('shows correct button state when not layouting', () => {
			render(<GraphControls {...defaultProps} isLayouting={false} />);

			const layoutButton = screen.getByText('force');
			expect(layoutButton).not.toBeDisabled();
			expect(layoutButton).toHaveClass('hover:bg-gray-200');
		});

		it('prevents interaction when layouting', async () => {
			const user = userEvent.setup();
			const onLayoutChange = vi.fn();

			render(
				<GraphControls
					{...defaultProps}
					isLayouting={true}
					onLayoutChange={onLayoutChange}
				/>
			);

			const layoutButton = screen.getByText('Layouting...');
			await user.click(layoutButton);

			expect(onLayoutChange).not.toHaveBeenCalled();
		});
	});

	describe('Visual Styling', () => {
		it('applies correct CSS classes for container', () => {
			const { container } = render(<GraphControls {...defaultProps} />);

			const controlsContainer = container.firstChild;
			expect(controlsContainer).toHaveClass('graph-controls');
			expect(controlsContainer).toHaveClass('bg-white');
			expect(controlsContainer).toHaveClass('rounded-lg');
			expect(controlsContainer).toHaveClass('shadow-lg');
		});

		it('has proper spacing for control elements', () => {
			const { container } = render(<GraphControls {...defaultProps} />);

			const controlsDiv = container.querySelector('.space-y-2');
			expect(controlsDiv).toBeInTheDocument();
		});

		it('displays labels with correct styling', () => {
			render(<GraphControls {...defaultProps} />);

			const layoutLabel = screen.getByText('Layout');
			expect(layoutLabel).toHaveClass('text-xs');
			expect(layoutLabel).toHaveClass('font-medium');
			expect(layoutLabel).toHaveClass('text-gray-600');
		});
	});

	describe('Edge Cases', () => {
		it('handles extreme zoom values gracefully', async () => {
			const user = userEvent.setup();
			const onZoomChange = vi.fn();

			render(
				<GraphControls
					{...defaultProps}
					zoomLevel={0.01}
					onZoomChange={onZoomChange}
				/>
			);

			await user.click(screen.getByText('-'));

			// Should clamp to minimum
			expect(onZoomChange).toHaveBeenCalledWith(0.1);
		});

		it('handles very high zoom levels', () => {
			render(<GraphControls {...defaultProps} zoomLevel={10} />);

			expect(screen.getByText('1000%')).toBeInTheDocument();
		});

		it('works without optional className', () => {
			expect(() => {
				render(<GraphControls {...defaultProps} />);
			}).not.toThrow();
		});
	});

	describe('Multiple Rapid Interactions', () => {
		it('handles rapid zoom clicks correctly', async () => {
			const user = userEvent.setup();
			const onZoomChange = vi.fn();

			render(
				<GraphControls
					{...defaultProps}
					onZoomChange={onZoomChange}
				/>
			);

			const zoomInButton = screen.getByText('+');

			// Rapid clicks
			await user.click(zoomInButton);
			await user.click(zoomInButton);
			await user.click(zoomInButton);

			expect(onZoomChange).toHaveBeenCalledTimes(3);
		});

		it('handles mixed zoom and reset interactions', async () => {
			const user = userEvent.setup();
			const onZoomChange = vi.fn();
			const onPanReset = vi.fn();

			render(
				<GraphControls
					{...defaultProps}
					onZoomChange={onZoomChange}
					onPanReset={onPanReset}
				/>
			);

			await user.click(screen.getByText('+'));
			await user.click(screen.getByText('Reset View'));
			await user.click(screen.getByText('-'));

			expect(onZoomChange).toHaveBeenCalledTimes(2);
			expect(onPanReset).toHaveBeenCalledTimes(1);
		});
	});
});
