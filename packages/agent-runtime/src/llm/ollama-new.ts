import { LLMService, LLMRequestOptions, LLMResponse, Message } from './types';

/**
 * Ollama service configuration options
 */
export interface OllamaConfig {
	/**
	 * Ollama API base URL
	 * @default "http://localhost:11434/api"
	 */
	baseUrl?: string;

	/**
	 * Default model to use
	 * @default "llama3"
	 */
	defaultModel?: string;

	/**
	 * Temperature parameter (0.0 - 1.0)
	 * @default 0.7
	 */
	temperature?: number;

	/**
	 * Maximum tokens to generate
	 * @default 4096
	 */
	maxTokens?: number;

	/**
	 * System prompt to use
	 */
	systemPrompt?: string | undefined;

	/**
	 * Request timeout in milliseconds
	 * @default 120000 (2 minutes)
	 */
	timeout?: number;
}

// Internal type for Ollama options
interface OllamaRequestParams {
	model: string;
	messages?: { role: string; content: string }[];
	prompt?: string;
	system?: string;
	options?: {
		temperature?: number;
		num_predict?: number;
	};
	stream?: boolean;
}

/**
 * Adapter for Ollama LLM service
 * Allows integration with locally hosted Ollama models
 */
export class OllamaService implements LLMService {
	private baseUrl: string;
	private defaultModel: string;
	private defaultTemperature: number;
	private defaultMaxTokens: number;
	private defaultSystemPrompt: string | undefined;
	private timeout: number;

	constructor(config?: OllamaConfig) {
		this.baseUrl = config?.baseUrl || 'http://localhost:11434/api';
		this.defaultModel = config?.defaultModel || 'llama3';
		this.defaultTemperature = config?.temperature ?? 0.7;
		this.defaultMaxTokens = config?.maxTokens ?? 4096;
		this.defaultSystemPrompt = config?.systemPrompt;
		this.timeout = config?.timeout ?? 120000; // Default 2 minutes
	}

	/**
	 * Convert standard LLM messages to Ollama format
	 */
	private convertToOllamaMessages(messages: Message[]): Array<{ role: string; content: string }> {
		return messages.map(msg => ({
			role: msg.role,
			content: msg.content,
		}));
	}

	/**
	 * Perform a completion request to Ollama
	 */
	async complete(options: LLMRequestOptions): Promise<LLMResponse> {
		// Get parameters from options or defaults
		const modelName = this.defaultModel;
		const temperature = options.temperature ?? this.defaultTemperature;
		const maxTokens = options.maxTokens ?? this.defaultMaxTokens;
		const systemPrompt = options.systemPrompt || this.defaultSystemPrompt;

		let ollamaOptions: OllamaRequestParams = {
			model: modelName,
			options: {
				temperature,
				num_predict: maxTokens,
			},
		};

		// Add system prompt if provided
		if (systemPrompt) {
			ollamaOptions.system = systemPrompt;
		}

		if (options.messages) {
			// Use chat completion API
			ollamaOptions.messages = this.convertToOllamaMessages(options.messages);

			try {
				const response = await fetch(`${this.baseUrl}/chat`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(ollamaOptions),
					signal: AbortSignal.timeout(this.timeout),
				});

				if (!response.ok) {
					const errorBody = await response.text();
					throw new Error(`Ollama API error (${response.status}): ${errorBody}`);
				}

				const data = await response.json();

				return {
					content: data.message?.content || '',
					usage: {
						promptTokens: data.prompt_eval_count || 0,
						completionTokens: data.eval_count || 0,
						totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
					},
				};
			} catch (error) {
				throw new Error(`Ollama completion error: ${(error as Error).message}`);
			}
		} else {
			// For compatibility, handle case with no messages (should not happen with proper usage)
			ollamaOptions.prompt = '';

			try {
				const response = await fetch(`${this.baseUrl}/generate`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(ollamaOptions),
					signal: AbortSignal.timeout(this.timeout),
				});

				if (!response.ok) {
					const errorBody = await response.text();
					throw new Error(`Ollama API error (${response.status}): ${errorBody}`);
				}

				const data = await response.json();

				return {
					content: data.response || '',
					usage: {
						promptTokens: data.prompt_eval_count || 0,
						completionTokens: data.eval_count || 0,
						totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
					},
				};
			} catch (error) {
				throw new Error(`Ollama completion error: ${(error as Error).message}`);
			}
		}
	}

	/**
	 * Stream a completion request from Ollama
	 */
	async *streamComplete(options: LLMRequestOptions): AsyncIterable<Partial<LLMResponse>> {
		// Get parameters from options or defaults
		const modelName = this.defaultModel;
		const temperature = options.temperature ?? this.defaultTemperature;
		const maxTokens = options.maxTokens ?? this.defaultMaxTokens;
		const systemPrompt = options.systemPrompt || this.defaultSystemPrompt;

		let ollamaOptions: OllamaRequestParams = {
			model: modelName,
			options: {
				temperature,
				num_predict: maxTokens,
			},
			stream: true,
		};

		// Add system prompt if provided
		if (systemPrompt) {
			ollamaOptions.system = systemPrompt;
		}

		let endpoint: string;

		if (options.messages) {
			// Use chat completion API
			endpoint = `${this.baseUrl}/chat`;
			ollamaOptions.messages = this.convertToOllamaMessages(options.messages);
		} else {
			// For compatibility, handle case with no messages (should not happen with proper usage)
			endpoint = `${this.baseUrl}/generate`;
			ollamaOptions.prompt = '';
		}

		let accumulatedContent = '';
		let promptTokens = 0;
		let completionTokens = 0;

		try {
			const controller = new AbortController();
			const { signal } = controller;

			// Set timeout
			const timeoutId = setTimeout(() => controller.abort(), this.timeout);

			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(ollamaOptions),
				signal,
			});

			if (!response.ok) {
				clearTimeout(timeoutId);
				const errorBody = await response.text();
				throw new Error(`Ollama API error (${response.status}): ${errorBody}`);
			}

			if (!response.body) {
				clearTimeout(timeoutId);
				throw new Error('Ollama API returned no readable stream');
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					const lines = chunk.split('\n').filter(Boolean);

					for (const line of lines) {
						try {
							const data = JSON.parse(line);

							if (options.messages) {
								// Chat completion format
								if (data.message?.content) {
									const newText = data.message.content;
									accumulatedContent += newText;

									yield {
										content: newText,
									};
								}

								// Track token usage
								if (data.prompt_eval_count) promptTokens = data.prompt_eval_count;
								if (data.eval_count) completionTokens = data.eval_count;
							} else {
								// Legacy completion format
								if (data.response) {
									const newText = data.response;
									accumulatedContent += newText;

									yield {
										content: newText,
									};
								}

								// Track token usage
								if (data.prompt_eval_count) promptTokens = data.prompt_eval_count;
								if (data.eval_count) completionTokens = data.eval_count;
							}

							// Handle done flag
							if (data.done) {
								clearTimeout(timeoutId);
								yield {
									usage: {
										promptTokens,
										completionTokens,
										totalTokens: promptTokens + completionTokens,
									},
								};
								return;
							}
						} catch (e) {
							console.warn('Error parsing Ollama SSE chunk:', e);
							continue;
						}
					}
				}
			} finally {
				clearTimeout(timeoutId);
				reader.releaseLock();
			}
		} catch (error) {
			if ((error as Error).name === 'AbortError') {
				throw new Error(`Ollama stream timed out after ${this.timeout}ms`);
			}
			throw new Error(`Ollama stream error: ${(error as Error).message}`);
		}

		// Final yield with accumulated information
		yield {
			usage: {
				promptTokens,
				completionTokens,
				totalTokens: promptTokens + completionTokens,
			},
		};
	}

	/**
	 * Estimate token count for a text or messages
	 * Note: This is an approximation as Ollama doesn't provide exact token counting
	 */
	async countTokens(text: string | Message[]): Promise<number> {
		// If no text or messages, return 0
		if (typeof text === 'string' && !text) {
			return 0;
		}

		if (Array.isArray(text) && text.length === 0) {
			return 0;
		}

		// Simple approximation based on characters
		// This is a rough estimate as different models tokenize differently
		if (typeof text === 'string') {
			// Approximate token count (English ~4 chars per token on average)
			return Math.ceil(text.length / 4);
		} else {
			// For messages, count all content
			return Math.ceil(text.reduce((acc, msg) => acc + (msg.content?.length || 0), 0) / 4);
		}
	}
}
