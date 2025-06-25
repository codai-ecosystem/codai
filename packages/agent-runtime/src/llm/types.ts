/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { z } from 'zod';

/**
 * LLM Model Provider Types
 */
export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'ollama' | 'local' | 'custom';

/**
 * LLM Model Configuration
 */
export interface LLMModelConfig {
	/**
	 * The provider of the model
	 */
	provider: LLMProvider;

	/**
	 * Model name (e.g. 'gpt-4o', 'claude-3-opus', etc.)
	 */
	model: string;

	/**
	 * API Key for the provider
	 */
	apiKey?: string;

	/**
	 * Base URL for API requests
	 */
	baseUrl?: string;

	/**
	 * Maximum number of tokens in response
	 */
	maxTokens?: number;

	/**
	 * Temperature for generation (0.0 - 1.0)
	 */
	temperature?: number;

	/**
	 * Additional provider-specific parameters
	 */
	parameters?: Record<string, any>;
}

/**
 * Message role for chat messages
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'function' | 'tool';

/**
 * Chat message format
 */
export interface Message {
	/**
	 * Role of the message sender
	 */
	role: MessageRole;

	/**
	 * Content of the message
	 */
	content: string;

	/**
	 * Name of the function or tool (optional)
	 */
	name?: string;
}

/**
 * LLM Function definition for function calling
 */
export interface LLMFunction {
	/**
	 * Name of the function
	 */
	name: string;

	/**
	 * Description of the function
	 */
	description?: string;

	/**
	 * JSON Schema for the function parameters
	 */
	parameters: Record<string, any>;

	/**
	 * Whether the function is required to be called
	 */
	required?: boolean;
}

/**
 * Tool definition for tool calling
 */
export interface LLMTool {
	/**
	 * Type of the tool (usually 'function')
	 */
	type: 'function';

	/**
	 * Function definition for the tool
	 */
	function: LLMFunction;
}

/**
 * Response object from LLM
 */
export interface LLMResponse {
	/**
	 * Generated text content
	 */
	content: string;

	/**
	 * Function/tool calls if any
	 */
	toolCalls?: {
		name: string;
		arguments: Record<string, any>;
	}[];

	/**
	 * Usage statistics
	 */
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
}

/**
 * Request options for LLM API calls
 */
export interface LLMRequestOptions {
	/**
	 * System prompt to set context
	 */
	systemPrompt?: string | undefined;

	/**
	 * Conversation messages
	 */
	messages: Message[];

	/**
	 * Available tools for the model
	 */
	tools?: LLMTool[] | undefined;

	/**
	 * Temperature (0.0 - 1.0)
	 */
	temperature?: number | undefined;

	/**
	 * Maximum tokens in response
	 */
	maxTokens?: number | undefined;

	/**
	 * Stop sequences
	 */
	stop?: string[] | undefined;

	/**
	 * Stream the response
	 */
	stream?: boolean | undefined;
}

/**
 * Interface for LLM service implementations
 */
export interface LLMService {
	/**
	 * Generate a completion from the LLM
	 */
	complete(options: LLMRequestOptions): Promise<LLMResponse>;

	/**
	 * Stream a completion from the LLM
	 */
	streamComplete(options: LLMRequestOptions): AsyncIterable<Partial<LLMResponse>>;

	/**
	 * Calculate token count for a message or prompt
	 */
	countTokens(text: string | Message[]): Promise<number>;
}

// Zod schema for LLM configuration validation
export const LLMModelConfigSchema = z.object({
	provider: z.enum(['openai', 'anthropic', 'google', 'ollama', 'local', 'custom']),
	model: z.string(),
	apiKey: z.string().optional(),
	baseUrl: z.string().url().optional(),
	maxTokens: z.number().positive().optional(),
	temperature: z.number().min(0).max(1).optional(),
	parameters: z.record(z.any()).optional(),
});
