/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * AIDE Agent Runtime
 * Main entry point for the agent orchestration system
 */

// Core runtime and types
export { AgentRuntime } from './AgentRuntime';
export * from './types';

// Settings management
export * from './settings';

// Agent implementations
export { BaseAgentImpl } from './agents/BaseAgentImpl';
export { PlannerAgent } from './agents/PlannerAgent';
export { BuilderAgent } from './agents/BuilderAgent';
export { DesignerAgent } from './agents/DesignerAgent';
export { TesterAgent } from './agents/TesterAgent';
export { DeployerAgent } from './agents/DeployerAgent';
export { HistoryAgent } from './agents/HistoryAgent';

// Re-export memory graph types for convenience
export type { MemoryGraphEngine, AnyNode } from '@aide/memory-graph';

// LLM integration
export * from './llm';
