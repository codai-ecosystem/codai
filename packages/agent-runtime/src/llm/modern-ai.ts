/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { generateText, streamText, LanguageModel } from 'ai';
import { LLMModelConfig, LLMProvider, Message, LLMResponse, LLMRequestOptions, LLMService } from './types';

/**
 * Modern AI SDK service for AIDE agent runtime
 * Provides unified interface for multiple LLM providers using Vercel AI SDK
 */
export class ModernAIService implements LLMService {
	private model: LanguageModel;
	private config: LLMModelConfig;

	constructor(config: LLMModelConfig) {
		this.config = config;
		this.model = this.createModel(config);
	}

	private createModel(config: LLMModelConfig): LanguageModel {
		const settings = {
			apiKey: config.apiKey,
			...(config.baseUrl && { baseURL: config.baseUrl })
		};

		switch (config.provider) {
			case 'openai':
				return openai(config.model as any, settings as any);
			case 'anthropic':
				return anthropic(config.model as any, settings as any);
			case 'google':
				return google(config.model as any, settings as any);
			default:
				throw new Error(`Unsupported provider: ${config.provider}`);
		}
	}

	/**
	 * Generate a completion from the LLM
	 */
	async complete(options: LLMRequestOptions): Promise<LLMResponse> {
		try {
			const result = await generateText({
				model: this.model,
				messages: options.messages.map(msg => ({
					role: msg.role as any,
					content: msg.content
				})),
				...(options.maxTokens && { maxTokens: options.maxTokens }),
				...(options.temperature && { temperature: options.temperature })
			});

			return {
				content: result.text,
				usage: {
					promptTokens: result.usage?.promptTokens || 0,
					completionTokens: result.usage?.completionTokens || 0,
					totalTokens: result.usage?.totalTokens || 0
				}
			};
		} catch (error) {
			throw new Error(`AI generation failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Stream a completion from the LLM
	 */
	async *streamComplete(options: LLMRequestOptions): AsyncIterable<Partial<LLMResponse>> {
		try {
			const result = await streamText({
				model: this.model,
				messages: options.messages.map(msg => ({
					role: msg.role as any,
					content: msg.content
				})),
				...(options.maxTokens && { maxTokens: options.maxTokens }),
				...(options.temperature && { temperature: options.temperature })
			});

			for await (const delta of result.textStream) {
				yield { content: delta };
			}

			// Final chunk with usage info
			const usage = await result.usage;
			yield {
				usage: {
					promptTokens: usage?.promptTokens || 0,
					completionTokens: usage?.completionTokens || 0,
					totalTokens: usage?.totalTokens || 0
				}
			};
		} catch (error) {
			throw new Error(`AI streaming failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Calculate token count for a message or prompt
	 */
	async countTokens(text: string | Message[]): Promise<number> {
		// Rough approximation - in real implementation would use tokenizer
		if (typeof text === 'string') {
			return Math.ceil(text.length / 4);
		}
		return Math.ceil(text.reduce((acc, msg) => acc + msg.content.length, 0) / 4);
	}

	/**
	 * Get model configuration
	 */
	getConfig(): LLMModelConfig {
		return { ...this.config };
	}

	/**
	 * Update model configuration
	 */
	updateConfig(updates: Partial<LLMModelConfig>): void {
		this.config = { ...this.config, ...updates };
		if (updates.provider || updates.model || updates.apiKey || updates.baseUrl) {
			this.model = this.createModel(this.config);
		}
	}
}

/**
 * Create modern AI service instance
 */
export function createModernAIService(config: LLMModelConfig): ModernAIService {
	return new ModernAIService(config);
}

/**
 * Default configurations for modern AI providers
 */
export const modernAIConfigs: Record<LLMProvider, Omit<LLMModelConfig, 'apiKey'>> = {
	openai: {
		provider: 'openai',
		model: 'gpt-4o',
		maxTokens: 4096,
		temperature: 0.7
	},
	anthropic: {
		provider: 'anthropic',
		model: 'claude-3-5-sonnet-20241022',
		maxTokens: 8192,
		temperature: 0.7
	},
	google: {
		provider: 'google',
		model: 'gemini-1.5-pro',
		maxTokens: 8192,
		temperature: 0.7
	},
	ollama: {
		provider: 'ollama',
		model: 'llama3.2',
		baseUrl: 'http://localhost:11434',
		maxTokens: 4096,
		temperature: 0.7
	},
	local: {
		provider: 'local',
		model: 'local-model',
		maxTokens: 4096,
		temperature: 0.7
	},
	custom: {
		provider: 'custom',
		model: 'custom-model',
		maxTokens: 4096,
		temperature: 0.7
	}
};
