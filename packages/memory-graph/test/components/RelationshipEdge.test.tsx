/**
 * Unit tests for RelationshipEdge component
 * Tests rendering, positioning, styling, and interactions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RelationshipEdge } from '../../src/components/RelationshipEdge';
import type { Relationship } from '../../src/schemas';

describe('RelationshipEdge Component', () => {
	const mockOnDelete = vi.fn();
	const user = userEvent.setup();
	const createRelationship = (type: string = 'contains'): Relationship => ({
		id: 'rel-1',
		type: type as any,
		fromNodeId: 'node-1',
		toNodeId: 'node-2',
	});

	const defaultProps = {
		edge: createRelationship(),
		fromPosition: { x: 100, y: 100 },
		toPosition: { x: 300, y: 200 },
		isSelected: false,
		onDelete: mockOnDelete,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	// Helper to render component with SVG wrapper
	const renderEdge = (props = {}) => {
		const combinedProps = { ...defaultProps, ...props };
		return render(
			<svg width="500" height="400">
				<RelationshipEdge {...combinedProps} />
			</svg>
		);
	};

	describe('Basic Rendering', () => {
		it('renders relationship edge with correct structure', () => {
			const { container } = renderEdge();

			const edgeGroup = container.querySelector('.relationship-edge');
			expect(edgeGroup).toBeInTheDocument();

			const line = container.querySelector('line');
			expect(line).toBeInTheDocument();

			const arrow = container.querySelector('polygon');
			expect(arrow).toBeInTheDocument();

			const label = container.querySelector('text');
			expect(label).toBeInTheDocument();
			expect(label).toHaveTextContent('contains');
		});

		it('applies correct positioning to line element', () => {
			const { container } = renderEdge();

			const line = container.querySelector('line');
			expect(line).toHaveAttribute('x1');
			expect(line).toHaveAttribute('y1');
			expect(line).toHaveAttribute('x2');
			expect(line).toHaveAttribute('y2');
		});
		it('positions label at midpoint of line', () => {
			const { container } = renderEdge();

			const text = container.querySelector('text');
			expect(text).toHaveAttribute('text-anchor', 'middle');
		});
	});

	describe('Relationship Types and Styling', () => {
		const relationshipTypes = [
			{ type: 'contains', expectedColor: '#3B82F6' },
			{ type: 'depends_on', expectedColor: '#EF4444' },
			{ type: 'implements', expectedColor: '#10B981' },
			{ type: 'extends', expectedColor: '#8B5CF6' },
			{ type: 'uses', expectedColor: '#F59E0B' },
			{ type: 'configures', expectedColor: '#6B7280' },
			{ type: 'tests', expectedColor: '#EC4899' },
		];

		relationshipTypes.forEach(({ type, expectedColor }) => {
			it(`renders ${type} relationship with correct color`, () => {
				const relationship = createRelationship(type);
				const { container } = renderEdge({ edge: relationship });

				const line = container.querySelector('line');
				expect(line).toHaveAttribute('stroke', expectedColor);

				const arrow = container.querySelector('polygon');
				expect(arrow).toHaveAttribute('fill', expectedColor);

				const label = container.querySelector('text');
				expect(label).toHaveTextContent(type);
			});
		});

		it('renders unknown relationship type with default color', () => {
			const relationship = createRelationship('unknown_type');
			const { container } = renderEdge({ edge: relationship });

			const line = container.querySelector('line');
			expect(line).toHaveAttribute('stroke', '#6B7280');
		});
		it('renders depends_on relationship with dashed line', () => {
			const relationship = createRelationship('depends_on');
			const { container } = renderEdge({ edge: relationship });

			const line = container.querySelector('line');
			expect(line).toHaveAttribute('stroke-dasharray', '5,5');
		});

		it('renders non-depends_on relationships with solid line', () => {
			const relationship = createRelationship('contains');
			const { container } = renderEdge({ edge: relationship });

			const line = container.querySelector('line');
			expect(line).toHaveAttribute('stroke-dasharray', 'none');
		});
	});

	describe('Selection State', () => {
		it('shows normal styling when not selected', () => {
			const { container } = renderEdge({ isSelected: false });

			const edgeGroup = container.querySelector('.relationship-edge');
			expect(edgeGroup).not.toHaveClass('selected');

			const line = container.querySelector('line');
			expect(line).toHaveAttribute('stroke-width', '2');

			const deleteButton = container.querySelector('circle');
			expect(deleteButton).not.toBeInTheDocument();
		});

		it('shows selected styling when selected', () => {
			const { container } = renderEdge({ isSelected: true });

			const edgeGroup = container.querySelector('.relationship-edge');
			expect(edgeGroup).toHaveClass('selected');

			const line = container.querySelector('line');
			expect(line).toHaveAttribute('stroke-width', '3');

			const deleteButton = container.querySelector('circle');
			expect(deleteButton).toBeInTheDocument();
		});

		it('shows delete button only when selected and onDelete is provided', () => {
			const { container } = renderEdge({ isSelected: true, onDelete: mockOnDelete });

			const deleteButton = container.querySelector('circle');
			expect(deleteButton).toBeInTheDocument();
			expect(deleteButton).toHaveAttribute('fill', 'red');
		});

		it('does not show delete button when selected but onDelete is not provided', () => {
			const { container } = renderEdge({ isSelected: true, onDelete: undefined });

			const deleteButton = container.querySelector('circle');
			expect(deleteButton).not.toBeInTheDocument();
		});
	});

	describe('Edge Positioning and Geometry', () => {
		it('calculates correct line positions with node offset', () => {
			const fromPos = { x: 0, y: 0 };
			const toPos = { x: 200, y: 0 };
			const { container } = renderEdge({
				fromPosition: fromPos,
				toPosition: toPos
			});

			const line = container.querySelector('line');
			const x1 = parseFloat(line?.getAttribute('x1') || '0');
			const x2 = parseFloat(line?.getAttribute('x2') || '0');

			// Line should be offset from node centers to avoid overlap
			expect(x1).toBeGreaterThan(fromPos.x);
			expect(x2).toBeLessThan(toPos.x);
		});

		it('handles vertical positioning correctly', () => {
			const fromPos = { x: 100, y: 50 };
			const toPos = { x: 100, y: 250 };
			const { container } = renderEdge({
				fromPosition: fromPos,
				toPosition: toPos
			});

			const line = container.querySelector('line');
			expect(line).toBeInTheDocument();

			const y1 = parseFloat(line?.getAttribute('y1') || '0');
			const y2 = parseFloat(line?.getAttribute('y2') || '0');

			expect(y1).toBeGreaterThan(fromPos.y);
			expect(y2).toBeLessThan(toPos.y);
		});

		it('creates proper arrow head geometry', () => {
			const { container } = renderEdge();

			const arrow = container.querySelector('polygon');
			expect(arrow).toBeInTheDocument();

			const points = arrow?.getAttribute('points');
			expect(points).toBeTruthy();
			expect(points?.split(' ')).toHaveLength(3); // Triangle has 3 points
		});
	});

	describe('Interactions', () => {
		it('calls onDelete when delete button is clicked', async () => {
			const { container } = renderEdge({ isSelected: true, onDelete: mockOnDelete });

			const deleteButton = container.querySelector('circle');
			if (deleteButton) {
				await user.click(deleteButton);
			}

			expect(mockOnDelete).toHaveBeenCalledTimes(1);
		});

		it('handles click events on edge elements', () => {
			const { container } = renderEdge();

			const line = container.querySelector('line');
			expect(line).toBeInTheDocument();
			// Edge selection would typically be handled by parent component
		});
	});

	describe('Edge Calculations', () => {
		it('handles diagonal relationships correctly', () => {
			const fromPos = { x: 0, y: 0 };
			const toPos = { x: 300, y: 400 };
			const { container } = renderEdge({
				fromPosition: fromPos,
				toPosition: toPos
			});

			const line = container.querySelector('line');
			expect(line).toBeInTheDocument();

			// Should have calculated proper start and end points
			const x1 = parseFloat(line?.getAttribute('x1') || '0');
			const y1 = parseFloat(line?.getAttribute('y1') || '0');
			const x2 = parseFloat(line?.getAttribute('x2') || '0');
			const y2 = parseFloat(line?.getAttribute('y2') || '0');

			// Start point should be offset from origin towards target
			expect(x1).toBeGreaterThan(fromPos.x);
			expect(y1).toBeGreaterThan(fromPos.y);

			// End point should be offset from target towards origin
			expect(x2).toBeLessThan(toPos.x);
			expect(y2).toBeLessThan(toPos.y);
		});

		it('handles very short relationships', () => {
			const fromPos = { x: 100, y: 100 };
			const toPos = { x: 120, y: 110 };
			const { container } = renderEdge({
				fromPosition: fromPos,
				toPosition: toPos
			});

			const line = container.querySelector('line');
			expect(line).toBeInTheDocument();
			// Should render without errors even for very short distances
		});
	});

	describe('Label Positioning', () => {
		it('positions label at the midpoint of the line', () => {
			const fromPos = { x: 100, y: 100 };
			const toPos = { x: 300, y: 200 };
			const { container } = renderEdge({
				fromPosition: fromPos,
				toPosition: toPos
			});

			const text = container.querySelector('text');
			const x = parseFloat(text?.getAttribute('x') || '0');
			const y = parseFloat(text?.getAttribute('y') || '0');

			// Should be approximately at midpoint
			expect(x).toBeCloseTo((fromPos.x + toPos.x) / 2, 0);
			// Y should be slightly above the line (- 5 offset)
			expect(y).toBeLessThan((fromPos.y + toPos.y) / 2);
		});
		it('renders label with correct text properties', () => {
			const { container } = renderEdge();

			const text = container.querySelector('text');
			expect(text).toHaveAttribute('text-anchor', 'middle');
			expect(text).toHaveAttribute('font-size', '10');
			expect(text).toHaveClass('text-xs', 'fill-gray-600');
		});
	});

	describe('Error Handling', () => {
		it('handles missing relationship properties gracefully', () => {
			const incompleteRelationship = {
				id: 'rel-1',
				type: 'contains',
				fromNodeId: 'node-1',
				toNodeId: 'node-2',
			} as Relationship;

			expect(() => {
				renderEdge({ edge: incompleteRelationship });
			}).not.toThrow();
		});

		it('handles invalid positions gracefully', () => {
			expect(() => {
				renderEdge({
					fromPosition: { x: NaN, y: 0 },
					toPosition: { x: 100, y: NaN }
				});
			}).not.toThrow();
		});
	});
});
