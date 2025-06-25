import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import { MemoryGraphVisualization } from '../../src/components/MemoryGraphVisualization';
import { MemoryGraph } from '../../src/schemas';
import { createFeatureNode, createScreenNode, createRelationship } from '../utils/testHelpers';

// Mock the CSS file
vi.mock('../../src/components/MemoryGraphVisualization.css', () => ({}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = vi.fn(() => ({
	width: 800,
	height: 600,
	top: 0,
	left: 0,
	bottom: 600,
	right: 800,
	x: 0,
	y: 0,
	toJSON: vi.fn(),
}));

describe('MemoryGraphVisualization Component', () => {
	const createTestGraph = (): MemoryGraph => {
		const featureNode = createFeatureNode({ name: 'Login Feature' });
		const screenNode = createScreenNode({ name: 'Login Screen' });
		const relationship = createRelationship({
			fromNodeId: featureNode.id,
			toNodeId: screenNode.id,
			type: 'contains',
		});

		return {
			id: 'test-graph',
			name: 'Test Graph',
			version: '1.0.0',
			createdAt: new Date(),
			updatedAt: new Date(),
			nodes: [featureNode, screenNode],
			relationships: [relationship],
		};
	};

	const defaultProps = {
		graph: createTestGraph(),
		isEditable: false,
		layout: 'force' as const,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('renders graph visualization with nodes', () => {
			render(<MemoryGraphVisualization {...defaultProps} />);

			expect(screen.getByText('Login Feature')).toBeDefined();
			expect(screen.getByText('Login Screen')).toBeDefined();
		});

		it('applies custom className', () => {
			const { container } = render(
				<MemoryGraphVisualization {...defaultProps} className="custom-graph" />
			);

			expect((container.firstChild as HTMLElement)?.classList.contains('custom-graph')).toBe(true);
		});

		it('renders empty graph gracefully', () => {
			const emptyGraph: MemoryGraph = {
				id: 'empty-graph',
				name: 'Empty Graph',
				version: '1.0.0',
				createdAt: new Date(),
				updatedAt: new Date(),
				nodes: [],
				relationships: [],
			};

			expect(() => {
				render(<MemoryGraphVisualization {...defaultProps} graph={emptyGraph} />);
			}).not.toThrow();
		});
	});

	describe('Node Interaction', () => {
		it('selects node when clicked', async () => {
			const onNodeSelect = vi.fn();
			render(<MemoryGraphVisualization {...defaultProps} onNodeSelect={onNodeSelect} />);

			const featureNode = screen.getByText('Login Feature');
			await fireEvent.click(featureNode);

			expect(onNodeSelect).toHaveBeenCalled();
		});
	});

	describe('Error Handling', () => {
		it('handles missing node data gracefully', () => {
			const graphWithMissingData: MemoryGraph = {
				id: 'test-graph',
				name: 'Test Graph',
				version: '1.0.0',
				createdAt: new Date(),
				updatedAt: new Date(),
				nodes: [
					{
						id: 'test-node',
						type: 'feature',
						name: '',
						createdAt: new Date(),
						updatedAt: new Date(),
						version: '1.0.0',
					} as any,
				],
				relationships: [],
			};

			expect(() => {
				render(<MemoryGraphVisualization {...defaultProps} graph={graphWithMissingData} />);
			}).not.toThrow();
		});

		it('handles invalid relationships gracefully', () => {
			const graphWithInvalidRelationship: MemoryGraph = {
				id: 'test-graph',
				name: 'Test Graph',
				version: '1.0.0',
				createdAt: new Date(),
				updatedAt: new Date(),
				nodes: [createFeatureNode()],
				relationships: [
					{
						id: 'invalid-rel',
						fromNodeId: 'non-existent',
						toNodeId: 'also-non-existent',
						type: 'contains',
						strength: 1,
						createdAt: new Date(),
					},
				],
			};

			expect(() => {
				render(<MemoryGraphVisualization {...defaultProps} graph={graphWithInvalidRelationship} />);
			}).not.toThrow();
		});
	});
});
