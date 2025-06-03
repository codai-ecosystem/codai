/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { describe, it, expect } from 'vitest';
import { createModernAIService, modernAIConfigs } from '../src/llm/modern-ai';
import { LLMModelConfig } from '../src/llm/types';

describe('ModernAIService', () => {
	it('should create service with OpenAI config', () => {
		const config: LLMModelConfig = {
			...modernAIConfigs.openai,
			apiKey: 'test-key'
		};

		const service = createModernAIService(config);
		expect(service).toBeDefined();
		expect(service.getConfig().provider).toBe('openai');
		expect(service.getConfig().model).toBe('gpt-4o');
	});

	it('should create service with Anthropic config', () => {
		const config: LLMModelConfig = {
			...modernAIConfigs.anthropic,
			apiKey: 'test-key'
		};

		const service = createModernAIService(config);
		expect(service).toBeDefined();
		expect(service.getConfig().provider).toBe('anthropic');
		expect(service.getConfig().model).toBe('claude-3-5-sonnet-20241022');
	});

	it('should create service with Google config', () => {
		const config: LLMModelConfig = {
			...modernAIConfigs.google,
			apiKey: 'test-key'
		};

		const service = createModernAIService(config);
		expect(service).toBeDefined();
		expect(service.getConfig().provider).toBe('google');
		expect(service.getConfig().model).toBe('gemini-1.5-pro');
	});

	it('should update configuration', () => {
		const config: LLMModelConfig = {
			...modernAIConfigs.openai,
			apiKey: 'test-key'
		};

		const service = createModernAIService(config);
		service.updateConfig({ temperature: 0.5 });

		expect(service.getConfig().temperature).toBe(0.5);
	});

	it('should estimate token count', async () => {
		const config: LLMModelConfig = {
			...modernAIConfigs.openai,
			apiKey: 'test-key'
		};

		const service = createModernAIService(config);
		const tokenCount = await service.countTokens('Hello world');

		expect(tokenCount).toBeGreaterThan(0);
	});
});
