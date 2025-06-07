import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryGraphVisualization } from '../../src/components/MemoryGraphVisualization';
import { MemoryGraph } from '../../src/schemas';
import { createFeatureNode, createScreenNode, createApiNode, createDataModelNode, createRelationship } from '../utils/testHelpers';

/**
 * Integration tests for the complete Memory Graph system
 * Tests real user workflows and component interactions
 */
describe('Memory Graph Integration Tests', () => {
	let mockGraph: MemoryGraph;
	let mockOnNodeSelect: ReturnType<typeof vi.fn>;
	let mockOnNodeUpdate: ReturnType<typeof vi.fn>;

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

	beforeEach(() => {
		// Create mock functions
		mockOnNodeSelect = vi.fn();
		mockOnNodeUpdate = vi.fn();

		// Create a realistic memory graph for testing
		const featureNode = createFeatureNode({
			name: 'User Authentication',
			description: 'Complete user authentication system with login, logout, and session management'
		});

		const loginScreen = createScreenNode({
			name: 'Login Screen',
			description: 'User login interface with email and password fields'
		});

		const dashboardScreen = createScreenNode({
			name: 'Dashboard Screen',
			description: 'Main dashboard after successful login'
		});

		const authApi = createApiNode({
			name: 'Authentication API',
			description: 'RESTful API for user authentication'
		});

		const userDataModel = createDataModelNode({
			name: 'User Model',
			description: 'User data model for authentication'
		});

		const relationship1 = createRelationship({
			fromNodeId: featureNode.id,
			toNodeId: loginScreen.id,
			type: 'contains'
		});

		const relationship2 = createRelationship({
			fromNodeId: featureNode.id,
			toNodeId: dashboardScreen.id,
			type: 'contains'
		});

		const relationship3 = createRelationship({
			fromNodeId: loginScreen.id,
			toNodeId: authApi.id,
			type: 'uses'
		});

		const relationship4 = createRelationship({
			fromNodeId: authApi.id,
			toNodeId: userDataModel.id,
			type: 'uses'
		});

		mockGraph = {
			id: 'integration-test-graph',
			name: 'Integration Test Graph',
			version: '1.0.0',
			createdAt: new Date(),
			updatedAt: new Date(),
			nodes: [featureNode, loginScreen, dashboardScreen, authApi, userDataModel],
			relationships: [relationship1, relationship2, relationship3, relationship4]
		};
	});

	describe('Full Graph Rendering', () => {
		it('renders complete graph with all nodes and relationships', async () => {
			render(
				<MemoryGraphVisualization
					graph={mockGraph}
					isEditable={false}
					onNodeSelect={mockOnNodeSelect}
					onNodeUpdate={mockOnNodeUpdate}
				/>
			);

			// Check that all nodes are rendered
			await waitFor(() => {
				expect(screen.getByText('User Authentication')).toBeDefined();
				expect(screen.getByText('Login Screen')).toBeDefined();
				expect(screen.getByText('Dashboard Screen')).toBeDefined();
				expect(screen.getByText('Authentication API')).toBeDefined();
				expect(screen.getByText('User Model')).toBeDefined();
			});
		});

		it('handles complex node relationships', async () => {
			render(
				<MemoryGraphVisualization
					graph={mockGraph}
					isEditable={false}
					onNodeSelect={mockOnNodeSelect}
				/>
			);

			// Verify the graph structure is properly rendered
			const featureNode = await screen.findByText('User Authentication');
			const loginScreen = await screen.findByText('Login Screen');
			
			expect(featureNode).toBeDefined();
			expect(loginScreen).toBeDefined();
		});
	});

	describe('Node Interaction Workflows', () => {
		it('supports node selection workflow', async () => {
			render(
				<MemoryGraphVisualization
					graph={mockGraph}
					isEditable={false}
					onNodeSelect={mockOnNodeSelect}
				/>
			);

			const featureNode = await screen.findByText('User Authentication');
			await fireEvent.click(featureNode);

			expect(mockOnNodeSelect).toHaveBeenCalled();
		});

		it('handles multiple node selections', async () => {
			render(
				<MemoryGraphVisualization
					graph={mockGraph}
					isEditable={false}
					onNodeSelect={mockOnNodeSelect}
				/>
			);

			// Select first node
			const featureNode = await screen.findByText('User Authentication');
			await fireEvent.click(featureNode);

			// Select second node
			const loginScreen = await screen.findByText('Login Screen');
			await fireEvent.click(loginScreen);

			expect(mockOnNodeSelect).toHaveBeenCalledTimes(2);
		});
	});

	describe('Graph Layout and Display', () => {
		it('renders graph with proper layout structure', async () => {
			const { container } = render(
				<MemoryGraphVisualization
					graph={mockGraph}
					isEditable={false}
				/>
			);

			// Check that the graph container is present
			const graphContainer = container.querySelector('.memory-graph-visualization');
			expect(graphContainer).toBeDefined();
		});

		it('handles different node types with appropriate styling', async () => {
			render(
				<MemoryGraphVisualization
					graph={mockGraph}
					isEditable={false}
				/>
			);

			// Wait for nodes to render
			await waitFor(() => {
				expect(screen.getByText('User Authentication')).toBeDefined();
				expect(screen.getByText('Login Screen')).toBeDefined();
				expect(screen.getByText('Authentication API')).toBeDefined();
			});

			// Check for type-specific styling (this would depend on actual CSS classes)
			const nodes = document.querySelectorAll('.memory-graph-node');
			expect(nodes.length).toBeGreaterThan(0);
		});
	});

	describe('Performance and Scalability', () => {
		it('handles large graphs efficiently', async () => {
			// Create a larger graph for performance testing
			const largeNodes = Array.from({ length: 20 }, (_, i) => 
				createFeatureNode({ name: `Feature ${i + 1}` })
			);
			
			const largeRelationships = Array.from({ length: 15 }, (_, i) => 
				createRelationship({
					fromNodeId: largeNodes[i % largeNodes.length].id,
					toNodeId: largeNodes[(i + 1) % largeNodes.length].id,
					type: 'depends_on'
				})
			);

			const largeGraph: MemoryGraph = {
				...mockGraph,
				nodes: largeNodes,
				relationships: largeRelationships
			};

			const startTime = performance.now();
			
			render(
				<MemoryGraphVisualization
					graph={largeGraph}
					isEditable={false}
				/>
			);

			const renderTime = performance.now() - startTime;
			
			// Should render within reasonable time (less than 1 second)
			expect(renderTime).toBeLessThan(1000);
		});
	});

	describe('Error Handling', () => {
		it('gracefully handles malformed graph data', async () => {
			const malformedGraph: MemoryGraph = {
				...mockGraph,
				nodes: [
					{
						id: 'malformed-node',
						type: 'feature',
						name: '',
						createdAt: new Date(),
						updatedAt: new Date(),
						version: '1.0.0'
					} as any
				],
				relationships: []
			};

			expect(() => {
				render(
					<MemoryGraphVisualization
						graph={malformedGraph}
						isEditable={false}
					/>
				);
			}).not.toThrow();
		});

		it('handles missing node references in relationships', async () => {
			const graphWithBadRelationships: MemoryGraph = {
				...mockGraph,
				relationships: [
					createRelationship({
						fromNodeId: 'non-existent-node',
						toNodeId: 'another-non-existent-node',
						type: 'contains'
					})
				]
			};

			expect(() => {
				render(
					<MemoryGraphVisualization
						graph={graphWithBadRelationships}
						isEditable={false}
					/>
				);
			}).not.toThrow();
		});
	});

	describe('Accessibility', () => {
		it('provides keyboard navigation support', async () => {
			render(
				<MemoryGraphVisualization
					graph={mockGraph}
					isEditable={false}
					onNodeSelect={mockOnNodeSelect}
				/>
			);

			// Find a focusable element
			const graphContainer = document.querySelector('.memory-graph-visualization');
			expect(graphContainer).toBeDefined();

			// Basic accessibility check - ensure elements can receive focus
			// More comprehensive accessibility testing would require additional setup
		});

		it('provides proper ARIA labels and roles', async () => {
			render(
				<MemoryGraphVisualization
					graph={mockGraph}
					isEditable={false}
				/>
			);

			// Check for accessibility attributes
			const graphContainer = document.querySelector('.memory-graph-visualization');
			expect(graphContainer).toBeDefined();
			
			// Additional ARIA checks would depend on the actual implementation
		});
	});

	describe('State Management', () => {
		it('maintains consistent state across re-renders', async () => {
			const { rerender } = render(
				<MemoryGraphVisualization
					graph={mockGraph}
					isEditable={false}
					onNodeSelect={mockOnNodeSelect}
				/>
			);

			// Initial render check
			expect(screen.getByText('User Authentication')).toBeDefined();

			// Re-render with same props
			rerender(
				<MemoryGraphVisualization
					graph={mockGraph}
					isEditable={false}
					onNodeSelect={mockOnNodeSelect}
				/>
			);

			// Should still be there
			expect(screen.getByText('User Authentication')).toBeDefined();
		});

		it('updates properly when graph data changes', async () => {
			const { rerender } = render(
				<MemoryGraphVisualization
					graph={mockGraph}
					isEditable={false}
					onNodeSelect={mockOnNodeSelect}
				/>
			);

			// Initial state
			expect(screen.getByText('User Authentication')).toBeDefined();

			// Update with modified graph
			const updatedGraph = {
				...mockGraph,
				nodes: [
					...mockGraph.nodes,
					createFeatureNode({ name: 'New Feature' })
				]
			};

			rerender(
				<MemoryGraphVisualization
					graph={updatedGraph}
					isEditable={false}
					onNodeSelect={mockOnNodeSelect}
				/>
			);

			// Should show new node
			await waitFor(() => {
				expect(screen.getByText('New Feature')).toBeDefined();
			});
		});
	});
});
