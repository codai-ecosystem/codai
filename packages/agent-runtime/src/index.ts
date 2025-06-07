/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * AIDE Agent Runtime
 * Main entry point for the agent orchestration system
 */

// Core runtime and types
export { AgentRuntime } from './AgentRuntime.js';
export * from './types.js';

// Settings management
export * from './settings/index.js';

// Agent implementations
export { BaseAgentImpl } from './agents/BaseAgentImpl.js';
export { PlannerAgent } from './agents/PlannerAgent.js';
export { BuilderAgent } from './agents/BuilderAgent.js';
export { DesignerAgent } from './agents/DesignerAgent.js';
export { TesterAgent } from './agents/TesterAgent.js';
export { DeployerAgent } from './agents/DeployerAgent.js';
export { HistoryAgent } from './agents/HistoryAgent.js';

// Re-export memory graph types for convenience
export type { MemoryGraphEngine, AnyNode } from '@dragoscatalin/memory-graph';

// LLM integration
export * from './llm/index.js';
