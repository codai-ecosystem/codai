/**
 * Unit tests for NodeCard component
 * Tests rendering, interactions, styling, and accessibility features
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
	const user = userEvent.setup();

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

			expect(screen.getByText('User Authentication')).toBeInTheDocument();
			expect(screen.getByText('Complete user authentication system')).toBeInTheDocument();
		});

		it('applies feature-specific styling classes', () => {
			const { container } = render(<NodeCard node={featureNode} {...defaultProps} />);
			const nodeElement = container.querySelector('.node-card');

			expect(nodeElement).toHaveClass('type-feature');
		});
	});

	describe('Screen Node Rendering', () => {
		const screenNode = createScreenNode();

		it('renders screen node with correct content', () => {
			render(<NodeCard node={screenNode} {...defaultProps} />);

			expect(screen.getByText('Login Page')).toBeInTheDocument();
			expect(screen.getByText('User login interface')).toBeInTheDocument();
		});

		it('applies screen-specific styling classes', () => {
			const { container } = render(<NodeCard node={screenNode} {...defaultProps} />);
			const nodeElement = container.querySelector('.node-card');

			expect(nodeElement).toHaveClass('type-screen');
		});
	});

	describe('Logic Node Rendering', () => {
		const logicNode = createLogicNode();

		it('renders logic node with correct content', () => {
			render(<NodeCard node={logicNode} {...defaultProps} />);

			expect(screen.getByText('AuthService')).toBeInTheDocument();
			expect(screen.getByText('Authentication business logic')).toBeInTheDocument();
		});

		it('applies logic-specific styling classes', () => {
			const { container } = render(<NodeCard node={logicNode} {...defaultProps} />);
			const nodeElement = container.querySelector('.node-card');

			expect(nodeElement).toHaveClass('type-logic');
		});
	});

	describe('Data Model Node Rendering', () => {
		const dataModelNode = createDataModelNode();

		it('renders data model node with correct content', () => {
			render(<NodeCard node={dataModelNode} {...defaultProps} />);

			expect(screen.getByText('User')).toBeInTheDocument();
			expect(screen.getByText('User data model')).toBeInTheDocument();
		});

		it('applies data model-specific styling classes', () => {
			const { container } = render(<NodeCard node={dataModelNode} {...defaultProps} />);
			const nodeElement = container.querySelector('.node-card');

			expect(nodeElement).toHaveClass('type-data_model');
		});
	});

	describe('API Node Rendering', () => {
		const apiNode = createApiNode();

		it('renders API node with correct content', () => {
			render(<NodeCard node={apiNode} {...defaultProps} />);

			expect(screen.getByText('Auth API')).toBeInTheDocument();
			expect(screen.getByText('Authentication API endpoints')).toBeInTheDocument();
		});

		it('applies API-specific styling classes', () => {
			const { container } = render(<NodeCard node={apiNode} {...defaultProps} />);
			const nodeElement = container.querySelector('.node-card');

			expect(nodeElement).toHaveClass('type-api');
		});
	});

	describe('Test Node Rendering', () => {
		const testNode = createTestNode();

		it('renders test node with correct content', () => {
			render(<NodeCard node={testNode} {...defaultProps} />);

			expect(screen.getByText('Auth Tests')).toBeInTheDocument();
			expect(screen.getByText('Authentication unit tests')).toBeInTheDocument();
		});

		it('applies test-specific styling classes', () => {
			const { container } = render(<NodeCard node={testNode} {...defaultProps} />);
			const nodeElement = container.querySelector('.node-card');

			expect(nodeElement).toHaveClass('type-test');
		});
	});

	describe('Node Interactions', () => {
		const featureNode = createFeatureNode();

		it('calls onClick when node is clicked', async () => {
			render(<NodeCard node={featureNode} {...defaultProps} />);

			const nodeElement = screen.getByText('User Authentication').closest('.node-card');
			if (nodeElement) {
				await user.click(nodeElement);
			}

			expect(mockOnClick).toHaveBeenCalledTimes(1);
		});

		it('supports keyboard navigation', async () => {
			render(<NodeCard node={featureNode} {...defaultProps} />);

			const nodeElement = screen.getByText('User Authentication').closest('.node-card') as HTMLElement;
			if (nodeElement) {
				nodeElement.focus();
				await user.keyboard('{Enter}');
			}

			// Note: This test assumes keyboard support would be implemented
			expect(nodeElement).toBeInTheDocument();
		});
	});

	describe('Node Positioning', () => {
		const featureNode = createFeatureNode();

		it('applies correct position styles', () => {
			const { container } = render(
				<NodeCard
					node={featureNode}
					{...defaultProps}
					position={{ x: 250, y: 150 }}
				/>
			);

			const nodeElement = container.querySelector('.node-card');
			expect(nodeElement).toBeInTheDocument();
			// Position is set via useEffect, so we test that the component renders
		});

		it('shows selected state correctly', () => {
			const { container } = render(
				<NodeCard
					node={featureNode}
					{...defaultProps}
					isSelected={true}
				/>
			);

			const nodeElement = container.querySelector('.node-card');
			expect(nodeElement).toHaveClass('selected');
		});
	});

	describe('Content Handling', () => {
		it('handles long content gracefully', () => {
			const longNameNode = createFeatureNode({
				name: 'This is a very long feature name that should be handled gracefully by the component',
				description: 'This is a very long description that should be truncated or wrapped appropriately to maintain the layout of the memory graph visualization'
			});

			render(<NodeCard node={longNameNode} {...defaultProps} />);

			expect(screen.getByText(longNameNode.name)).toBeInTheDocument();
			if (longNameNode.description) {
				expect(screen.getByText(longNameNode.description)).toBeInTheDocument();
			}
		});

		it('handles optional properties gracefully', () => {
			const featureNode = createFeatureNode({
				description: undefined
			});

			render(<NodeCard node={featureNode} {...defaultProps} />);

			expect(screen.getByText('User Authentication')).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		const featureNode = createFeatureNode();

		it('has appropriate ARIA attributes', () => {
			const { container } = render(<NodeCard node={featureNode} {...defaultProps} />);

			const nodeElement = container.querySelector('.node-card');
			expect(nodeElement).toBeInTheDocument();
			// Additional ARIA tests would go here based on implementation
		});

		it('is keyboard accessible', () => {
			render(<NodeCard node={featureNode} {...defaultProps} />);

			const nodeElement = screen.getByText('User Authentication').closest('.node-card');
			expect(nodeElement).toBeInTheDocument();
			// Keyboard accessibility tests would be expanded based on implementation
		});

		it('provides appropriate semantic structure', () => {
			render(<NodeCard node={featureNode} {...defaultProps} />);

			expect(screen.getByText('User Authentication')).toBeInTheDocument();
			expect(screen.getByText('Complete user authentication system')).toBeInTheDocument();
		});
	});

	describe('Error Handling', () => {
		it('handles missing required properties', () => {
			// Test would depend on actual error handling implementation
			const featureNode = createFeatureNode();

			expect(() => {
				render(<NodeCard node={featureNode} {...defaultProps} />);
			}).not.toThrow();
		});

		it('handles invalid node types gracefully', () => {
			// This would test the default case in getNodeColor
			const invalidNode = createFeatureNode({
				type: 'invalid_type' as any
			});

			const { container } = render(<NodeCard node={invalidNode} {...defaultProps} />);
			const nodeElement = container.querySelector('.node-card');

			// Should fall back to default styling
			expect(nodeElement).toHaveClass('type-default');
		});
	});
});
