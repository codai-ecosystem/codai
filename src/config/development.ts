/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * AIDE Development Environment Configuration
 * This file contains environment-specific settings for development
 */

export const developmentConfig = {
	// Memory Graph Configuration
	memoryGraph: {
		persistenceAdapter: 'filesystem', // 'filesystem' | 'memory' | 'indexeddb'
		persistencePath: './data/memory-graph',
		enableReactiveUpdates: true,
		debugMode: process.env.NODE_ENV === 'development',
	},

	// Agent Runtime Configuration
	agentRuntime: {
		maxConcurrentAgents: 5,
		messageTimeout: 30000,
		enableLogging: true,
		logLevel: 'debug' as const,
	},

	// AI Model Configuration
	aiModels: {
		openai: {
			apiKey: process.env.OPENAI_API_KEY,
			model: 'gpt-4',
			maxTokens: 4000,
		},
		anthropic: {
			apiKey: process.env.ANTHROPIC_API_KEY,
			model: 'claude-3-sonnet-20240229',
			maxTokens: 4000,
		},
	},

	// Extension Configuration
	extensions: {
		autoActivate: true,
		enableCopilotIntegration: true,
		debugExtensions: process.env.NODE_ENV === 'development',
	},
};
