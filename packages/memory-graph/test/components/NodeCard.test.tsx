/**
 * Unit tests for NodeCard component
 * Tests rendering, interactions, styling, and accessibility features
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NodeCard } from '../../src/components/NodeCard';
import {
	createFeatureNode,
	createScreenNode,
	createLogicNode,
	createDataModelNode,
	createApiNode,
	createTestNode
} from '../utils/testHelpers';

describe('NodeCard Component', () => {
	const mockOnClick = vi.fn();
	const mockOnUpdate = vi.fn();

	const defaultProps = {
		position: { x: 100, y: 200 },
		isSelected: false,
		isEditable: false,
		onClick: mockOnClick,
		onUpdate: mockOnUpdate,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Feature Node Rendering', () => {
		const featureNode = createFeatureNode();

		it('renders feature node with correct content', () => {
			render(<NodeCard node={featureNode} {...defaultProps} />);

			expect(screen.getByText(featureNode.name)).toBeDefined();
			if (featureNode.description) {
				expect(screen.getByText(featureNode.description)).toBeDefined();
			}
		});

		it('applies feature-specific styling classes', () => {
			const { container } = render(<NodeCard node={featureNode} {...defaultProps} />);
			const nodeElement = container.querySelector('.memory-graph-node');

			expect(nodeElement?.classList.contains('type-feature')).toBe(true);
		});

		it('displays feature icon', () => {
			render(<NodeCard node={featureNode} {...defaultProps} />);
			const iconElement = document.querySelector('.memory-graph-node__icon');
			expect(iconElement?.textContent).toBe('✨');
		});

		it('handles click events', async () => {
			render(<NodeCard node={featureNode} {...defaultProps} />);
			const nodeElement = document.querySelector('.memory-graph-node');
			
			if (nodeElement) {
				await fireEvent.click(nodeElement);
				expect(mockOnClick).toHaveBeenCalledTimes(1);
			}
		});
	});

	describe('Screen Node Rendering', () => {
		const screenNode = createScreenNode();

		it('renders screen node with correct styling', () => {
			const { container } = render(<NodeCard node={screenNode} {...defaultProps} />);
			const nodeElement = container.querySelector('.memory-graph-node');

			expect(nodeElement?.classList.contains('type-screen')).toBe(true);
		});

		it('displays screen icon', () => {
			render(<NodeCard node={screenNode} {...defaultProps} />);
			const iconElement = document.querySelector('.memory-graph-node__icon');
			expect(iconElement?.textContent).toBe('📱');
		});
	});

	describe('Logic Node Rendering', () => {
		const logicNode = createLogicNode();

		it('renders logic node with correct styling', () => {
			const { container } = render(<NodeCard node={logicNode} {...defaultProps} />);
			const nodeElement = container.querySelector('.memory-graph-node');

			expect(nodeElement?.classList.contains('type-logic')).toBe(true);
		});

		it('displays logic icon', () => {
			render(<NodeCard node={logicNode} {...defaultProps} />);
			const iconElement = document.querySelector('.memory-graph-node__icon');
			expect(iconElement?.textContent).toBe('⚙️');
		});
	});

	describe('Data Node Rendering', () => {
		const dataNode = createDataModelNode();

		it('renders data node with correct styling', () => {
			const { container } = render(<NodeCard node={dataNode} {...defaultProps} />);
			const nodeElement = container.querySelector('.memory-graph-node');

			expect(nodeElement?.classList.contains('type-data')).toBe(true);
		});

		it('displays data icon', () => {
			render(<NodeCard node={dataNode} {...defaultProps} />);
			const iconElement = document.querySelector('.memory-graph-node__icon');
			expect(iconElement?.textContent).toBe('💾');
		});
	});

	describe('API Node Rendering', () => {
		const apiNode = createApiNode();

		it('renders API node with correct styling', () => {
			const { container } = render(<NodeCard node={apiNode} {...defaultProps} />);
			const nodeElement = container.querySelector('.memory-graph-node');

			expect(nodeElement?.classList.contains('type-api')).toBe(true);
		});

		it('displays API icon', () => {
			render(<NodeCard node={apiNode} {...defaultProps} />);
			const iconElement = document.querySelector('.memory-graph-node__icon');
			expect(iconElement?.textContent).toBe('🔌');
		});
	});

	describe('Test Node Rendering', () => {
		const testNode = createTestNode();

		it('renders test node with correct styling', () => {
			const { container } = render(<NodeCard node={testNode} {...defaultProps} />);
			const nodeElement = container.querySelector('.memory-graph-node');

			expect(nodeElement?.classList.contains('type-test')).toBe(true);
		});

		it('displays test icon', () => {
			render(<NodeCard node={testNode} {...defaultProps} />);
			const iconElement = document.querySelector('.memory-graph-node__icon');
			expect(iconElement?.textContent).toBe('🧪');
		});
	});

	describe('Node Selection', () => {
		const testNode = createFeatureNode();

		it('applies selected styling when isSelected is true', () => {
			const { container } = render(
				<NodeCard 
					node={testNode} 
					{...defaultProps} 
					isSelected={true} 
				/>
			);
			const nodeElement = container.querySelector('.memory-graph-node');

			expect(nodeElement?.classList.contains('selected')).toBe(true);
		});

		it('does not apply selected styling when isSelected is false', () => {
			const { container } = render(
				<NodeCard 
					node={testNode} 
					{...defaultProps} 
					isSelected={false} 
				/>
			);
			const nodeElement = container.querySelector('.memory-graph-node');

			expect(nodeElement?.classList.contains('selected')).toBe(false);
		});
	});

	describe('Positioning', () => {
		const testNode = createFeatureNode();

		it('applies correct position transform', () => {
			const position = { x: 150, y: 250 };
			const { container } = render(
				<NodeCard 
					node={testNode} 
					{...defaultProps} 
					position={position} 
				/>
			);
			const nodeElement = container.querySelector('.memory-graph-node') as HTMLElement;

			expect(nodeElement?.style.transform).toBe(`translate(${position.x}px, ${position.y}px)`);
		});
	});

	describe('ReactFlow Compatibility', () => {
		const testNode = createFeatureNode();

		it('uses data prop when provided', () => {
			const nodeData = { ...testNode, name: 'Data Prop Node' };
			render(
				<NodeCard 
					node={testNode}
					data={nodeData}
					{...defaultProps} 
				/>
			);

			expect(screen.getByText('Data Prop Node')).toBeDefined();
		});

		it('uses selected prop for ReactFlow compatibility', () => {
			const { container } = render(
				<NodeCard 
					node={testNode}
					{...defaultProps}
					selected={true}
				/>
			);
			const nodeElement = container.querySelector('.memory-graph-node');

			expect(nodeElement?.classList.contains('selected')).toBe(true);
		});
	});

	describe('Custom Styling', () => {
		const testNode = createFeatureNode();

		it('applies custom className', () => {
			const { container } = render(
				<NodeCard 
					node={testNode}
					{...defaultProps}
					className="custom-node"
				/>
			);
			const nodeElement = container.querySelector('.memory-graph-node');

			expect(nodeElement?.classList.contains('custom-node')).toBe(true);
		});
	});

	describe('Accessibility', () => {
		const testNode = createFeatureNode();

		it('has proper cursor styling for interactions', () => {
			const { container } = render(<NodeCard node={testNode} {...defaultProps} />);
			const nodeElement = container.querySelector('.memory-graph-node') as HTMLElement;

			expect(nodeElement?.style.cursor).toBe('pointer');
		});

		it('prevents text selection', () => {
			const { container } = render(<NodeCard node={testNode} {...defaultProps} />);
			const nodeElement = container.querySelector('.memory-graph-node') as HTMLElement;

			expect(nodeElement?.style.userSelect).toBe('none');
		});
	});

	describe('Edge Cases', () => {
		it('handles nodes without description', () => {
			const nodeWithoutDescription = createFeatureNode();
			// Remove description to test edge case
			const { description, ...nodeData } = nodeWithoutDescription;
			
			expect(() => {
				render(
					<NodeCard 
						node={nodeData as any}
						{...defaultProps}
					/>
				);
			}).not.toThrow();
		});

		it('handles unknown node types gracefully', () => {
			const unknownNode = {
				...createFeatureNode(),
				type: 'unknown' as any
			};

			const { container } = render(<NodeCard node={unknownNode} {...defaultProps} />);
			const nodeElement = container.querySelector('.memory-graph-node');
			const iconElement = container.querySelector('.memory-graph-node__icon');

			expect(nodeElement?.classList.contains('type-default')).toBe(true);
			expect(iconElement?.textContent).toBe('📄');
		});
	});
});
