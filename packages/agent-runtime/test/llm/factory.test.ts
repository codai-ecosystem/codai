import { describe, it, expect } from 'vitest';
import { createLLMService, defaultLLMConfigs, createSystemPrompt } from '../../src/llm/factory';
import { OpenAIService } from '../../src/llm/openai';
import { AnthropicService } from '../../src/llm/anthropic';
import { OllamaService } from '../../src/llm/ollama';
import { LLMModelConfig } from '../../src/llm/types';

describe('LLM Factory', () => {
	describe('createLLMService', () => {
		it('should create OpenAI service', () => {
			const config: LLMModelConfig = {
				provider: 'openai',
				model: 'gpt-4o',
				apiKey: 'test-key',
			};

			const service = createLLMService(config);
			expect(service).toBeInstanceOf(OpenAIService);
		});

		it('should create Anthropic service', () => {
			const config: LLMModelConfig = {
				provider: 'anthropic',
				model: 'claude-3-opus-20240229',
				apiKey: 'test-key',
			};

			const service = createLLMService(config);
			expect(service).toBeInstanceOf(AnthropicService);
		});

		it('should create Ollama service', () => {
			const config: LLMModelConfig = {
				provider: 'ollama',
				model: 'llama3',
				baseUrl: 'http://localhost:11434',
			};

			const service = createLLMService(config);
			expect(service).toBeInstanceOf(OllamaService);
		});

		it('should throw error for local provider (not implemented)', () => {
			const config: LLMModelConfig = {
				provider: 'local',
				model: 'mixtral-8x7b',
			};

			expect(() => createLLMService(config)).toThrow('Local provider not implemented yet');
		});

		it('should throw error for custom provider (not implemented)', () => {
			const config: LLMModelConfig = {
				provider: 'custom',
				model: 'custom-model',
			};

			expect(() => createLLMService(config)).toThrow('Custom provider requires implementation');
		});

		it('should throw error for unknown provider', () => {
			const config = {
				provider: 'unknown' as any,
				model: 'test-model',
			};

			expect(() => createLLMService(config)).toThrow('Unknown LLM provider: unknown');
		});
	});

	describe('defaultLLMConfigs', () => {
		it('should have correct OpenAI defaults', () => {
			const openaiConfig = defaultLLMConfigs.openai;

			expect(openaiConfig).toEqual({
				provider: 'openai',
				model: 'gpt-4o',
				maxTokens: 2048,
				temperature: 0.7,
			});
		});

		it('should have correct Anthropic defaults', () => {
			const anthropicConfig = defaultLLMConfigs.anthropic;

			expect(anthropicConfig).toEqual({
				provider: 'anthropic',
				model: 'claude-3-opus-20240229',
				maxTokens: 4096,
				temperature: 0.7,
			});
		});

		it('should have correct Ollama defaults', () => {
			const ollamaConfig = defaultLLMConfigs.ollama;

			expect(ollamaConfig).toEqual({
				provider: 'ollama',
				model: 'llama3',
				baseUrl: 'http://localhost:11434/api',
				maxTokens: 2048,
				temperature: 0.7,
			});
		});

		it('should have correct local defaults', () => {
			const localConfig = defaultLLMConfigs.local;

			expect(localConfig).toEqual({
				provider: 'local',
				model: 'mixtral-8x7b',
				baseUrl: 'http://localhost:8080/v1',
				maxTokens: 2048,
				temperature: 0.7,
			});
		});

		it('should have correct custom defaults', () => {
			const customConfig = defaultLLMConfigs.custom;

			expect(customConfig).toEqual({
				provider: 'custom',
				model: 'custom-model',
			});
		});

		it('should include all provider types', () => {
			const expectedProviders = ['openai', 'anthropic', 'ollama', 'local', 'custom'];
			const actualProviders = Object.keys(defaultLLMConfigs);

			expect(actualProviders.sort()).toEqual(expectedProviders.sort());
		});
	});

	describe('createSystemPrompt', () => {
		it('should create planner agent system prompt', () => {
			const prompt = createSystemPrompt('planner');

			expect(prompt).toContain('expert software project planner');
			expect(prompt).toContain('Break down user requirements');
			expect(prompt).toContain('Estimate complexity');
			expect(prompt).toContain('Create a project plan');
		});

		it('should create planner agent system prompt with context', () => {
			const context = {
				projectType: 'React Web Application',
				constraints: 'Must be mobile-responsive',
			};

			const prompt = createSystemPrompt('planner', context);

			expect(prompt).toContain('expert software project planner');
			expect(prompt).toContain('Project type: React Web Application');
			expect(prompt).toContain('Key constraints: Must be mobile-responsive');
		});

		it('should create builder agent system prompt', () => {
			const prompt = createSystemPrompt('builder');

			expect(prompt).toContain('expert software developer');
			expect(prompt).toContain('Implement high-quality code');
			expect(prompt).toContain('Follow best practices');
			expect(prompt).toContain('proper error handling');
		});

		it('should create builder agent system prompt with context', () => {
			const context = {
				language: 'TypeScript',
				framework: 'Next.js',
			};

			const prompt = createSystemPrompt('builder', context);

			expect(prompt).toContain('expert software developer');
			expect(prompt).toContain('Primary language: TypeScript');
			expect(prompt).toContain('Framework: Next.js');
		});

		it('should create designer agent system prompt', () => {
			const prompt = createSystemPrompt('designer');

			expect(prompt).toContain('expert UI/UX designer');
			expect(prompt).toContain('user-friendly interface designs');
			expect(prompt).toContain('accessibility standards');
			expect(prompt).toContain('responsive layouts');
		});

		it('should create designer agent system prompt with context', () => {
			const context = {
				designSystem: 'Material Design',
				brandGuidelines: 'Corporate blue theme',
			};

			const prompt = createSystemPrompt('designer', context);

			expect(prompt).toContain('expert UI/UX designer');
			expect(prompt).toContain('Design system: Material Design');
			expect(prompt).toContain('Brand guidelines: Corporate blue theme');
		});

		it('should create tester agent system prompt', () => {
			const prompt = createSystemPrompt('tester');

			expect(prompt).toContain('expert software tester');
			expect(prompt).toContain('comprehensive test plans');
			expect(prompt).toContain('edge cases');
			expect(prompt).toContain('automated tests');
			expect(prompt).toContain('code quality');
		});

		it('should create deployer agent system prompt', () => {
			const prompt = createSystemPrompt('deployer');

			expect(prompt).toContain('expert DevOps engineer');
			expect(prompt).toContain('deployment strategies');
			expect(prompt).toContain('CI/CD pipelines');
			expect(prompt).toContain('monitoring');
		});

		it('should handle unknown agent type', () => {
			const prompt = createSystemPrompt('unknown-agent');

			expect(prompt).toContain('You are an AI assistant');
			expect(prompt).toContain('helpful and professional');
			expect(prompt).toContain('best practices');
		});

		it('should handle agent type with no context', () => {
			const prompt = createSystemPrompt('planner', {});

			expect(prompt).toContain('expert software project planner');
			expect(prompt).not.toContain('Project type:');
			expect(prompt).not.toContain('Key constraints:');
		});

		it('should handle partial context', () => {
			const context = {
				projectType: 'Mobile App',
				// constraints omitted
			};

			const prompt = createSystemPrompt('planner', context);

			expect(prompt).toContain('Project type: Mobile App');
			expect(prompt).not.toContain('Key constraints:');
		});
	});
});
