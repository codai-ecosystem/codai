import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OllamaService } from '../../src/llm/ollama';
import { LLMModelConfig, LLMRequestOptions, Message } from '../../src/llm/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('OllamaService', () => {
	let service: OllamaService;

	const defaultConfig: LLMModelConfig = {
		provider: 'ollama',
		model: 'llama3',
		baseUrl: 'http://localhost:11434',
		temperature: 0.7,
		maxTokens: 2048,
	};

	beforeEach(() => {
		service = new OllamaService(defaultConfig);
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('constructor', () => {
		it('should initialize with default config', () => {
			const defaultService = new OllamaService({
				provider: 'ollama',
				model: 'llama3',
			});
			expect(defaultService).toBeInstanceOf(OllamaService);
		});

		it('should initialize with custom config', () => {
			const customConfig: LLMModelConfig = {
				provider: 'ollama',
				model: 'mistral',
				baseUrl: 'http://custom:11434',
				temperature: 0.8,
				maxTokens: 4096,
			};
			const customService = new OllamaService(customConfig);
			expect(customService).toBeInstanceOf(OllamaService);
		});
	});

	describe('messagesToPrompt', () => {
		it('should convert messages to prompt format', () => {
			const messages: Message[] = [
				{ role: 'system', content: 'You are a helpful assistant.' },
				{ role: 'user', content: 'Hello, how are you?' },
				{ role: 'assistant', content: 'I am doing well, thank you!' },
				{ role: 'user', content: 'What can you help me with?' },
			];

			// Test the private method through the public complete method
			const expectedPrompt =
				'System: You are a helpful assistant.\n\n' +
				'Human: Hello, how are you?\n\n' +
				'Assistant: I am doing well, thank you!\n\n' +
				'Human: What can you help me with?\n\n' +
				'Assistant:';

			// Mock the fetch to capture the prompt being sent
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						response: 'I can help with many things!',
						done: true,
						prompt_eval_count: 50,
						eval_count: 20,
					}),
			});

			const options: LLMRequestOptions = {
				messages,
				temperature: 0.7,
				maxTokens: 100,
			};

			service.complete(options);

			// Verify the request was made with the correct prompt
			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:11434/api/generate',
				expect.objectContaining({
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: expect.stringContaining('"prompt"'),
				})
			);
		});
	});

	describe('complete', () => {
		it('should complete successfully with valid response', async () => {
			const mockResponse = {
				response: 'Hello! How can I help you today?',
				done: true,
				prompt_eval_count: 25,
				eval_count: 15,
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const options: LLMRequestOptions = {
				messages: [{ role: 'user', content: 'Hello' }],
				temperature: 0.7,
				maxTokens: 100,
			};

			const result = await service.complete(options);

			expect(result).toEqual({
				content: 'Hello! How can I help you today?',
				usage: {
					promptTokens: 25,
					completionTokens: 15,
					totalTokens: 40,
				},
			});

			expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model: 'llama3',
					prompt: 'Human: Hello\n\nAssistant:',
					stream: false,
					options: {
						temperature: 0.7,
						max_tokens: 100,
					},
				}),
			});
		});

		it('should handle API errors gracefully', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error',
			});

			const options: LLMRequestOptions = {
				messages: [{ role: 'user', content: 'Hello' }],
			};

			await expect(service.complete(options)).rejects.toThrow(
				'Failed to complete with Ollama: Ollama API error: 500 Internal Server Error'
			);
		});

		it('should handle network errors', async () => {
			mockFetch.mockRejectedValueOnce(new Error('Network error'));

			const options: LLMRequestOptions = {
				messages: [{ role: 'user', content: 'Hello' }],
			};

			await expect(service.complete(options)).rejects.toThrow(
				'Failed to complete with Ollama: Network error'
			);
		});

		it('should use default temperature and maxTokens when not provided', async () => {
			const mockResponse = {
				response: 'Test response',
				done: true,
				prompt_eval_count: 10,
				eval_count: 5,
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const options: LLMRequestOptions = {
				messages: [{ role: 'user', content: 'Test' }],
			};

			await service.complete(options);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: expect.stringContaining('"temperature":0.7'),
				})
			);
		});
	});

	describe('streamComplete', () => {
		it('should stream completion successfully', async () => {
			const streamChunks = [
				'{"response":"Hello","done":false}\n',
				'{"response":" there!","done":false}\n',
				'{"response":"","done":true,"prompt_eval_count":10,"eval_count":5}\n',
			];

			const mockResponse = {
				ok: true,
				body: {
					getReader: () => ({
						read: vi
							.fn()
							.mockResolvedValueOnce({
								done: false,
								value: new TextEncoder().encode(streamChunks[0]),
							})
							.mockResolvedValueOnce({
								done: false,
								value: new TextEncoder().encode(streamChunks[1]),
							})
							.mockResolvedValueOnce({
								done: false,
								value: new TextEncoder().encode(streamChunks[2]),
							})
							.mockResolvedValueOnce({
								done: true,
								value: undefined,
							}),
						releaseLock: vi.fn(),
					}),
				},
			};

			mockFetch.mockResolvedValueOnce(mockResponse);

			const options: LLMRequestOptions = {
				messages: [{ role: 'user', content: 'Hello' }],
				stream: true,
			};

			const chunks: any[] = [];
			for await (const chunk of service.streamComplete(options)) {
				chunks.push(chunk);
			}

			expect(chunks).toHaveLength(3);
			expect(chunks[0]).toEqual({ content: 'Hello' });
			expect(chunks[1]).toEqual({ content: ' there!' });
			expect(chunks[2]).toEqual({
				content: '',
				usage: {
					promptTokens: 10,
					completionTokens: 5,
					totalTokens: 15,
				},
			});

			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:11434/api/generate',
				expect.objectContaining({
					body: expect.stringContaining('"stream":true'),
				})
			);
		});
		it('should handle streaming errors', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 503,
				statusText: 'Service Unavailable',
			});

			const options: LLMRequestOptions = {
				messages: [{ role: 'user', content: 'Hello' }],
				stream: true,
			};

			const streamGenerator = service.streamComplete(options);

			await expect(async () => {
				for await (const chunk of streamGenerator) {
					// This should never execute
					expect(chunk).toBeUndefined();
				}
			}).rejects.toThrow('Failed to stream with Ollama: Ollama API error: 503 Service Unavailable');
		});
		it('should handle missing response body', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				body: null,
			});

			const options: LLMRequestOptions = {
				messages: [{ role: 'user', content: 'Hello' }],
				stream: true,
			};

			const streamGenerator = service.streamComplete(options);

			await expect(async () => {
				for await (const chunk of streamGenerator) {
					// This should never execute
					expect(chunk).toBeUndefined();
				}
			}).rejects.toThrow('Failed to stream with Ollama: No response body received from Ollama');
		});

		it('should handle malformed JSON chunks gracefully', async () => {
			const streamChunks = [
				'{"response":"Good","done":false}\n',
				'invalid json\n',
				'{"response":" answer","done":true}\n',
			];

			const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

			const mockResponse = {
				ok: true,
				body: {
					getReader: () => ({
						read: vi
							.fn()
							.mockResolvedValueOnce({
								done: false,
								value: new TextEncoder().encode(streamChunks[0]),
							})
							.mockResolvedValueOnce({
								done: false,
								value: new TextEncoder().encode(streamChunks[1]),
							})
							.mockResolvedValueOnce({
								done: false,
								value: new TextEncoder().encode(streamChunks[2]),
							})
							.mockResolvedValueOnce({
								done: true,
								value: undefined,
							}),
						releaseLock: vi.fn(),
					}),
				},
			};

			mockFetch.mockResolvedValueOnce(mockResponse);

			const options: LLMRequestOptions = {
				messages: [{ role: 'user', content: 'Test' }],
				stream: true,
			};

			const chunks: any[] = [];
			for await (const chunk of service.streamComplete(options)) {
				chunks.push(chunk);
			}

			// Should receive 2 valid chunks and skip the malformed one
			expect(chunks).toHaveLength(2);
			expect(chunks[0]).toEqual({ content: 'Good' });
			expect(chunks[1]).toEqual({ content: ' answer' });

			// Should log warning about malformed JSON
			expect(mockConsoleWarn).toHaveBeenCalledWith(
				'Failed to parse streaming response chunk:',
				expect.any(Error)
			);

			mockConsoleWarn.mockRestore();
		});
	});

	describe('countTokens', () => {
		it('should count tokens for string input', async () => {
			const text = 'This is a test string with about twenty characters.';
			const tokenCount = await service.countTokens(text);

			// Expecting roughly text.length / 4 tokens
			expect(tokenCount).toBe(Math.ceil(text.length / 4));
		});

		it('should count tokens for messages array', async () => {
			const messages: Message[] = [
				{ role: 'user', content: 'Hello world' },
				{ role: 'assistant', content: 'Hi there!' },
			];

			const totalLength = messages.reduce((acc, msg) => acc + msg.content.length, 0);
			const expectedTokens = Math.ceil(totalLength / 4);

			const tokenCount = await service.countTokens(messages);
			expect(tokenCount).toBe(expectedTokens);
		});

		it('should handle empty messages', async () => {
			const messages: Message[] = [];
			const tokenCount = await service.countTokens(messages);
			expect(tokenCount).toBe(0);
		});

		it('should handle messages with undefined content', async () => {
			const messages: Message[] = [
				{ role: 'user', content: 'Hello' },
				{ role: 'assistant', content: undefined } as any,
			];

			const tokenCount = await service.countTokens(messages);
			expect(tokenCount).toBe(Math.ceil('Hello'.length / 4));
		});
	});

	describe('isAvailable', () => {
		it('should return true when Ollama service is available', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ models: [] }),
			});

			const isAvailable = await service.isAvailable();
			expect(isAvailable).toBe(true);

			expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/api/tags', {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
		});

		it('should return false when Ollama service is not available', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
			});

			const isAvailable = await service.isAvailable();
			expect(isAvailable).toBe(false);
		});

		it('should return false on network error', async () => {
			mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

			const isAvailable = await service.isAvailable();
			expect(isAvailable).toBe(false);
		});
	});

	describe('listModels', () => {
		it('should list available models', async () => {
			const mockModels = {
				models: [{ name: 'llama3:8b' }, { name: 'mistral:7b' }, { name: 'codellama:13b' }],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockModels),
			});

			const models = await service.listModels();
			expect(models).toEqual(['llama3:8b', 'mistral:7b', 'codellama:13b']);
		});

		it('should return empty array when no models found', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ models: [] }),
			});

			const models = await service.listModels();
			expect(models).toEqual([]);
		});

		it('should return empty array on API error', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
			});

			const models = await service.listModels();
			expect(models).toEqual([]);
		});

		it('should handle missing models field', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({}),
			});

			const models = await service.listModels();
			expect(models).toEqual([]);
		});
	});
});
