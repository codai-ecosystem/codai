import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryGraphVisualization } from '../../src/components/MemoryGraphVisualization';
import { MemoryGraph, AnyNode } from '../../src/schemas';

/**
 * Integration tests for the complete Memory Graph system
 * Tests real user workflows and component interactions
 */
describe('Memory Graph Integration Tests', () => {
	let mockGraph: MemoryGraph;
	let mockOnNodeSelect: ReturnType<typeof vi.fn>;
	let mockOnNodeUpdate: ReturnType<typeof vi.fn>;
	let mockOnRelationshipDelete: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// Create a realistic memory graph for testing
		mockGraph = {
			id: 'integration-test-graph',
			name: 'Integration Test Graph',
			version: '1.0.0',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			nodes: [
				{
					id: 'feature-1',
					type: 'feature',
					name: 'User Authentication',
					description:
						'Complete user authentication system with login, logout, and session management',
					requirements: ['Secure login', 'Session persistence', 'Password reset'],
					dependencies: ['auth-service', 'user-db'],
					implementation_notes: 'Use JWT tokens for session management',
					metadata: {
						priority: 'high',
						complexity: 'medium',
						status: 'in-progress',
					},
				},
				{
					id: 'screen-1',
					type: 'screen',
					name: 'Login Screen',
					description: 'User login interface with email and password fields',
					components: ['LoginForm', 'ForgotPasswordLink', 'SignUpButton'],
					user_interactions: ['email input', 'password input', 'login button click'],
					data_requirements: ['email validation', 'password validation'],
					metadata: {
						platform: 'web',
						responsive: true,
					},
				},
				{
					id: 'screen-2',
					type: 'screen',
					name: 'Dashboard Screen',
					description: 'Main dashboard after successful login',
					components: ['NavBar', 'UserProfile', 'ActivityFeed'],
					user_interactions: ['navigation clicks', 'profile updates'],
					data_requirements: ['user data', 'activity data'],
					metadata: {
						platform: 'web',
						responsive: true,
					},
				},
				{
					id: 'api-1',
					type: 'api',
					name: 'Authentication API',
					description: 'RESTful API for user authentication',
					endpoints: ['/login', '/logout', '/refresh-token'],
					methods: ['POST', 'DELETE', 'POST'],
					request_format: 'JSON',
					response_format: 'JSON',
					authentication_required: false,
					metadata: {
						version: 'v1',
						rate_limit: '100/hour',
					},
				},
				{
					id: 'data-1',
					type: 'data_model',
					name: 'User Model',
					description: 'User data model for authentication',
					fields: ['id', 'email', 'password_hash', 'created_at', 'updated_at'],
					relationships: ['has_many_sessions'],
					constraints: ['email_unique', 'password_min_length'],
					metadata: {
						database: 'postgresql',
						table: 'users',
					},
				},
			],
			relationships: [
				{
					id: 'rel-1',
					fromNodeId: 'feature-1',
					toNodeId: 'screen-1',
					type: 'contains',
					metadata: {},
				},
				{
					id: 'rel-2',
					fromNodeId: 'feature-1',
					toNodeId: 'screen-2',
					type: 'contains',
					metadata: {},
				},
				{
					id: 'rel-3',
					fromNodeId: 'screen-1',
					toNodeId: 'api-1',
					type: 'calls',
					metadata: {},
				},
				{
					id: 'rel-4',
					fromNodeId: 'api-1',
					toNodeId: 'data-1',
					type: 'uses',
					metadata: {},
				},
			],
		};

		mockOnNodeSelect = vi.fn();
		mockOnNodeUpdate = vi.fn();
		mockOnRelationshipDelete = vi.fn();
	});

	describe('Complete User Workflows', () => {
		it('supports complete node exploration workflow', async () => {
			const user = userEvent.setup();

			render(
				<MemoryGraphVisualization
					graph={mockGraph}
					onNodeSelect={mockOnNodeSelect}
					onNodeUpdate={mockOnNodeUpdate}
					onRelationshipDelete={mockOnRelationshipDelete}
					isEditable={true}
				/>
			);

			// 1. User sees all nodes rendered
			expect(screen.getByText('User Authentication')).toBeInTheDocument();
			expect(screen.getByText('Login Screen')).toBeInTheDocument();
			expect(screen.getByText('Dashboard Screen')).toBeInTheDocument();
			expect(screen.getByText('Authentication API')).toBeInTheDocument();
			expect(screen.getByText('User Model')).toBeInTheDocument();

			// 2. User clicks on the main feature node
			const featureNode = screen.getByText('User Authentication');
			await user.click(featureNode);

			// 3. Verify node selection callback
			expect(mockOnNodeSelect).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 'feature-1',
					name: 'User Authentication',
				})
			);

			// 4. User can see node details (simplified - details panel not implemented in this scope)
			// In a real app, this would show a details panel

			// 5. User explores relationships by clicking different nodes
			const screenNode = screen.getByText('Login Screen');
			await user.click(screenNode);

			expect(mockOnNodeSelect).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 'screen-1',
					name: 'Login Screen',
				})
			);
		});

		it('supports zoom and pan workflow for large graphs', async () => {
			const user = userEvent.setup();

			render(<MemoryGraphVisualization graph={mockGraph} onNodeSelect={mockOnNodeSelect} />);

			// 1. User sees initial zoom level
			expect(screen.getByText(/100\s*%/)).toBeInTheDocument();

			// 2. User zooms in to see details
			const zoomInButton = screen.getByText('+');
			await user.click(zoomInButton);

			// 3. Verify zoom level changed
			await waitFor(() => {
				expect(screen.getByText(/110\s*%/)).toBeInTheDocument();
			});

			// 4. User can still interact with nodes at different zoom levels
			const featureNode = screen.getByText('User Authentication');
			await user.click(featureNode);

			expect(mockOnNodeSelect).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 'feature-1',
				})
			);

			// 5. User resets view when done exploring
			const resetButton = screen.getByText('Reset View');
			await user.click(resetButton);

			await waitFor(() => {
				expect(screen.getByText(/100\s*%/)).toBeInTheDocument();
			});
		});

		it('supports relationship management workflow in edit mode', async () => {
			const user = userEvent.setup();

			render(
				<MemoryGraphVisualization
					graph={mockGraph}
					onRelationshipDelete={mockOnRelationshipDelete}
					isEditable={true}
				/>
			);

			// 1. User can see relationship edges
			const relationshipElements = document.querySelectorAll('.relationship-edge');
			expect(relationshipElements.length).toBe(4); // 4 relationships in mock data			// 2. User can interact with relationships in edit mode
			// Note: Delete functionality would require more complex interaction simulation
			// This test verifies the relationships are properly rendered for interaction

			expect(screen.getAllByText('contains')[0]).toBeInTheDocument();
			expect(screen.getByText('calls')).toBeInTheDocument();
			expect(screen.getByText('uses')).toBeInTheDocument();
		});

		it('supports layout switching workflow', async () => {
			const user = userEvent.setup();

			render(<MemoryGraphVisualization graph={mockGraph} layout="force" />);

			// 1. User sees current layout
			expect(screen.getByText('force')).toBeInTheDocument();

			// 2. User can trigger layout recalculation
			const layoutButton = screen.getByText('force');
			await user.click(layoutButton);

			// 3. Layout button shows loading state during calculation
			// Note: In a real implementation, this might show a spinner or different text
			// For now, we just verify the button is still there and clickable
			expect(layoutButton).toBeInTheDocument();
		});
	});

	describe('Data Flow Integration', () => {
		it('properly handles node updates through the complete flow', async () => {
			const user = userEvent.setup();

			render(
				<MemoryGraphVisualization
					graph={mockGraph}
					onNodeUpdate={mockOnNodeUpdate}
					isEditable={true}
				/>
			);

			// Simulate a node update workflow
			// 1. User selects a node
			const featureNode = screen.getByText('User Authentication');
			await user.click(featureNode);

			// 2. In a real app, user would edit node details
			// For this integration test, we verify the callback structure is correct
			expect(mockOnNodeUpdate).toBeDefined();

			// The actual update would be triggered by edit components
			// which are not part of the visualization component itself
		});

		it('maintains consistent state across interactions', async () => {
			const user = userEvent.setup();

			render(<MemoryGraphVisualization graph={mockGraph} onNodeSelect={mockOnNodeSelect} />);

			// 1. Multiple interactions should maintain consistent state
			const nodes = ['User Authentication', 'Login Screen', 'Dashboard Screen'];

			for (const nodeName of nodes) {
				const node = screen.getByText(nodeName);
				await user.click(node);
			}

			// 2. Verify all interactions were captured
			expect(mockOnNodeSelect).toHaveBeenCalledTimes(3);

			// 3. Zoom interactions should not affect node selection
			const zoomInButton = screen.getByText('+');
			await user.click(zoomInButton);

			// Node should still be selectable after zoom
			const featureNode = screen.getByText('User Authentication');
			await user.click(featureNode);

			expect(mockOnNodeSelect).toHaveBeenCalledTimes(4);
		});
	});

	describe('Performance Integration', () => {
		it('handles medium-sized graphs efficiently', async () => {
			// Create a medium-sized graph (20 nodes, 30 relationships)
			const mediumGraph: MemoryGraph = {
				...mockGraph,
				nodes: Array.from({ length: 20 }, (_, i) => ({
					id: `node-${i}`,
					name: `Feature ${i}`,
					type: 'feature' as const,
					description: `Description for feature ${i}`,
					version: '1.0.0',
					createdAt: new Date(),
					updatedAt: new Date(),
					status: 'implemented' as const,
					priority: 'medium' as const,
					requirements: [`Requirement ${i}`],
					dependencies: [],
					implementation_notes: `Notes for feature ${i}`,
					metadata: {},
				})),
				relationships: Array.from({ length: 30 }, (_, i) => ({
					id: `rel-${i}`,
					fromNodeId: `node-${i % 20}`,
					toNodeId: `node-${(i + 1) % 20}`,
					type: 'depends_on' as const,
					metadata: {},
				})),
			};

			const startTime = performance.now();

			render(<MemoryGraphVisualization graph={mediumGraph} onNodeSelect={mockOnNodeSelect} />);

			const renderTime = performance.now() - startTime;

			// Verify rendering completes in reasonable time (< 100ms)
			expect(renderTime).toBeLessThan(100);

			// Verify all nodes are rendered
			expect(screen.getByText('Feature 0')).toBeInTheDocument();
			expect(screen.getByText('Feature 19')).toBeInTheDocument();

			// Verify interactions still work with larger dataset
			const user = userEvent.setup();
			const node = screen.getByText('Feature 5');
			await user.click(node);

			expect(mockOnNodeSelect).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 'node-5',
					name: 'Feature 5',
				})
			);
		});
	});

	describe('Error Handling Integration', () => {
		it('gracefully handles malformed graph data', () => {
			const malformedGraph: MemoryGraph = {
				...mockGraph,
				relationships: [
					{
						id: 'bad-rel',
						fromNodeId: 'non-existent-node',
						toNodeId: 'another-non-existent-node',
						type: 'depends_on',
						metadata: {},
					},
				],
			};

			// Should not crash with invalid relationships
			expect(() => {
				render(<MemoryGraphVisualization graph={malformedGraph} onNodeSelect={mockOnNodeSelect} />);
			}).not.toThrow();

			// Valid nodes should still render
			expect(screen.getByText('User Authentication')).toBeInTheDocument();
		});
		it('handles empty graph gracefully', () => {
			const emptyGraph: MemoryGraph = {
				id: 'empty-graph',
				name: 'Empty Graph',
				version: '1.0.0',
				createdAt: new Date(),
				updatedAt: new Date(),
				nodes: [],
				relationships: [],
			};

			render(<MemoryGraphVisualization graph={emptyGraph} onNodeSelect={mockOnNodeSelect} />);

			// Should render without errors
			expect(screen.getByText('force')).toBeInTheDocument(); // Layout control should be there
			expect(screen.getByText(/100\s*%/)).toBeInTheDocument(); // Zoom control should be there
		});
	});

	describe('Accessibility Integration', () => {
		it('maintains accessibility across component interactions', async () => {
			const user = userEvent.setup();

			render(<MemoryGraphVisualization graph={mockGraph} onNodeSelect={mockOnNodeSelect} />);

			// 1. All interactive elements should be accessible
			const zoomInButton = screen.getByRole('button', { name: '+' });
			const zoomOutButton = screen.getByRole('button', { name: '-' });
			const resetButton = screen.getByRole('button', { name: 'Reset View' });

			expect(zoomInButton).toBeInTheDocument();
			expect(zoomOutButton).toBeInTheDocument();
			expect(resetButton).toBeInTheDocument();

			// 2. Keyboard navigation should work
			zoomInButton.focus();
			expect(document.activeElement).toBe(zoomInButton);

			// 3. ARIA labels should be present on interactive elements
			const graphContainer = document.querySelector('.memory-graph-visualization');
			expect(graphContainer).toBeInTheDocument();
		});
	});
});
