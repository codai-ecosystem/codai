import React from 'react';
import { MemoryGraphVisualization } from '../src/components';
import { MemoryGraphBuilder } from '../src/builders';

// Simple test to validate the React components compile and render
export const TestMemoryGraphVisualization: React.FC = () => {
	// Create a simple test graph
	const graph = new MemoryGraphBuilder()
		.addFeatureNode('feature-1', 'User Authentication', {
			status: 'in_progress',
			priority: 'high',
			requirements: ['Login page', 'JWT tokens', 'Password reset'],
		})
		.addScreenNode('screen-1', 'Login Screen', {
			screenType: 'page',
			route: '/login',
			components: ['LoginForm', 'ForgotPasswordLink'],
		})
		.addLogicNode('logic-1', 'AuthService', {
			logicType: 'service',
			inputs: [
				{ name: 'credentials', type: 'LoginCredentials' },
				{ name: 'token', type: 'string' },
			],
			outputs: { type: 'AuthResult' },
		})
		.addRelationship('feature-1', 'screen-1', 'contains')
		.addRelationship('screen-1', 'logic-1', 'uses')
		.build();

	const handleNodeSelect = (node: any) => {
		console.log('Selected node:', node);
	};

	const handleNodeUpdate = (nodeId: string, updates: any) => {
		console.log('Update node:', nodeId, updates);
	};

	const handleRelationshipDelete = (edgeId: string) => {
		console.log('Delete relationship:', edgeId);
	};

	return (
		<div className="w-full h-screen">
			<MemoryGraphVisualization
				graph={graph}
				onNodeSelect={handleNodeSelect}
				onNodeUpdate={handleNodeUpdate}
				onRelationshipDelete={handleRelationshipDelete}
				isEditable={true}
				layout="force"
				className="border border-gray-300 rounded-lg"
			/>
		</div>
	);
};

export default TestMemoryGraphVisualization;
