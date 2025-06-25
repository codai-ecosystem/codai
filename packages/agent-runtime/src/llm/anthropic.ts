import { LLMService, LLMRequestOptions, LLMResponse, Message, LLMModelConfig } from './types.js';

/**
 * Anthropic Claude LLM service implementation
 */
export class AnthropicService implements LLMService {
	private apiKey: string;
	private model: string;
	private baseUrl: string;
	private defaultMaxTokens: number;
	private defaultTemperature: number;
	private anthropicVersion: string;

	/**
	 * Create a new Anthropic service instance
	 * @param config Configuration for the Anthropic service
	 */
	constructor(config: LLMModelConfig) {
		if (!config.apiKey) {
			throw new Error('Anthropic API key is required');
		}

		this.apiKey = config.apiKey;
		this.model = config.model || 'claude-3-opus-20240229';
		this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1/messages';
		this.defaultMaxTokens = config.maxTokens || 2048;
		this.defaultTemperature = config.temperature || 0.7;
		this.anthropicVersion = '2023-06-01'; // API version
	}

	/**
	 * Generate a completion from Anthropic Claude
	 * @param options Request options
	 * @returns Promise resolving to response
	 */
	async complete(options: LLMRequestOptions): Promise<LLMResponse> {
		try {
			// Convert to Anthropic format
			const messages = this.formatMessages(options.messages);

			// Build request payload
			const requestBody: any = {
				model: this.model,
				messages,
				max_tokens: options.maxTokens ?? this.defaultMaxTokens,
				temperature: options.temperature ?? this.defaultTemperature,
			};

			// Add system prompt if provided
			if (options.systemPrompt) {
				requestBody.system = options.systemPrompt;
			}

			// Add stop sequences if provided
			if (options.stop && options.stop.length > 0) {
				requestBody.stop_sequences = options.stop;
			}

			// Add tools if provided (Claude 3 supports tools)
			if (options.tools && options.tools.length > 0) {
				requestBody.tools = options.tools;
			}

			// Make API request
			const response = await fetch(this.baseUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': this.apiKey,
					'anthropic-version': this.anthropicVersion,
				},
				body: JSON.stringify(requestBody),
			});

			// Handle errors
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
			}

			// Parse response
			const data = await response.json();

			// Format the response
			const result: LLMResponse = {
				content: data.content[0].text,
				usage: {
					promptTokens: data.usage?.input_tokens || 0,
					completionTokens: data.usage?.output_tokens || 0,
					totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
				},
			};

			// Add tool calls if present (Claude's tool use format)
			if (data.content[0].type === 'tool_use') {
				result.toolCalls = [
					{
						name: data.content[0].name,
						arguments: data.content[0].input,
					},
				];
			}

			return result;
		} catch (error) {
			console.error('Anthropic service error:', error);
			throw error;
		}
	}

	/**
	 * Stream completions from Anthropic Claude
	 * @param options Request options
	 * @returns Async iterable of response chunks
	 */
	async *streamComplete(options: LLMRequestOptions): AsyncIterable<Partial<LLMResponse>> {
		try {
			// Convert to Anthropic format
			const messages = this.formatMessages(options.messages);

			// Build request payload
			const requestBody: any = {
				model: this.model,
				messages,
				max_tokens: options.maxTokens ?? this.defaultMaxTokens,
				temperature: options.temperature ?? this.defaultTemperature,
				stream: true,
			};

			// Add system prompt if provided
			if (options.systemPrompt) {
				requestBody.system = options.systemPrompt;
			}

			// Add stop sequences if provided
			if (options.stop && options.stop.length > 0) {
				requestBody.stop_sequences = options.stop;
			}

			// Add tools if provided
			if (options.tools && options.tools.length > 0) {
				requestBody.tools = options.tools;
			}

			// Make API request
			const response = await fetch(this.baseUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': this.apiKey,
					'anthropic-version': this.anthropicVersion,
				},
				body: JSON.stringify(requestBody),
			});

			// Handle errors
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
			}

			if (!response.body) {
				throw new Error('Response body is null');
			}

			// Process streaming response
			const reader = response.body.getReader();
			const decoder = new TextDecoder('utf-8');
			let buffer = '';

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) {
						break;
					}

					// Decode chunk and add to buffer
					buffer += decoder.decode(value, { stream: true });

					// Process complete lines in buffer
					let lineIndex;
					while ((lineIndex = buffer.indexOf('\n')) >= 0) {
						const line = buffer.slice(0, lineIndex).trim();
						buffer = buffer.slice(lineIndex + 1);

						if (!line) continue;
						if (line === 'data: [DONE]') break;

						// Parse SSE data
						if (line.startsWith('data: ')) {
							try {
								const data = JSON.parse(line.slice(6));

								// Handle content delta
								if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta') {
									yield { content: data.delta.text };
								}

								// Handle tool use events (simplified)
								if (
									data.type === 'content_block_start' &&
									data.content_block?.type === 'tool_use'
								) {
									yield {
										toolCalls: [
											{
												name: data.content_block.name,
												arguments: data.content_block.input,
											},
										],
									};
								}
							} catch (e) {
								console.error('Error parsing SSE data:', e);
							}
						}
					}
				}
			} finally {
				reader.releaseLock();
			}
		} catch (error) {
			console.error('Anthropic streaming error:', error);
			throw error;
		}
	}

	/**
	 * Format messages according to Anthropic's API
	 * @param messages Array of messages
	 * @returns Anthropic-formatted messages
	 */
	private formatMessages(messages: Message[]): any[] {
		return messages.map(message => {
			// Convert message role to Anthropic format
			let role = message.role;
			if (role === 'assistant') {
				role = 'assistant';
			} else if (role === 'function' || role === 'tool') {
				role = 'assistant';
			} else {
				role = 'user';
			}

			return {
				role,
				content: message.content,
			};
		});
	}

	/**
	 * Estimate token count for text or messages
	 * This is an approximation as actual tokenization depends on Claude's tokenizer
	 * @param textOrMessages Text or array of messages
	 * @returns Promise resolving to token count
	 */
	async countTokens(textOrMessages: string | Message[]): Promise<number> {
		try {
			// Simple approximation - 1 token ≈ 4 characters for English text
			if (typeof textOrMessages === 'string') {
				return Math.ceil(textOrMessages.length / 4);
			}

			// For messages, count tokens in all message content
			let totalCharacters = 0;
			for (const message of textOrMessages) {
				totalCharacters += message.content.length;
				// Add overhead for message format
				totalCharacters += 20;
			}

			return Math.ceil(totalCharacters / 4);
		} catch (error) {
			console.error('Token counting error:', error);
			throw error;
		}
	}
}
