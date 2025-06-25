/**
 * OpenAI LLM service implementation
 */
export class OpenAIService {
	/**
	 * Create a new OpenAI service instance
	 * @param config Configuration for the OpenAI service
	 */
	constructor(config) {
		if (!config.apiKey) {
			throw new Error('OpenAI API key is required');
		}
		this.apiKey = config.apiKey;
		this.model = config.model || 'gpt-4o';
		this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
		this.defaultMaxTokens = config.maxTokens || 2048;
		this.defaultTemperature = config.temperature || 0.7;
	}
	/**
	 * Generate a completion from OpenAI
	 * @param options Request options
	 * @returns Promise resolving to response
	 */
	async complete(options) {
		try {
			// Prepare request body
			const messages = [];
			// Add system message if provided
			if (options.systemPrompt) {
				messages.push({
					role: 'system',
					content: options.systemPrompt,
				});
			}
			// Add conversation messages
			messages.push(...options.messages);
			// Build request payload
			const requestBody = {
				model: this.model,
				messages,
				temperature: options.temperature ?? this.defaultTemperature,
				max_tokens: options.maxTokens ?? this.defaultMaxTokens,
			};
			// Add tools if provided
			if (options.tools && options.tools.length > 0) {
				requestBody.tools = options.tools;
			}
			// Add stop sequences if provided
			if (options.stop && options.stop.length > 0) {
				requestBody.stop = options.stop;
			}
			// Make API request
			const response = await fetch(`${this.baseUrl}/chat/completions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.apiKey}`,
				},
				body: JSON.stringify(requestBody),
			});
			// Handle errors
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
			}
			// Parse response
			const data = await response.json();
			const responseMessage = data.choices[0].message; // Format the response
			const result = {
				content: responseMessage.content || '',
				usage: data.usage
					? {
							promptTokens: data.usage.prompt_tokens,
							completionTokens: data.usage.completion_tokens,
							totalTokens: data.usage.total_tokens,
						}
					: {
							promptTokens: 0,
							completionTokens: 0,
							totalTokens: 0,
						},
			};
			// Add tool calls if present
			if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
				result.toolCalls = responseMessage.tool_calls.map(toolCall => ({
					name: toolCall.function.name,
					arguments: JSON.parse(toolCall.function.arguments),
				}));
			}
			return result;
		} catch (error) {
			console.error('OpenAI service error:', error);
			throw error;
		}
	}
	/**
	 * Stream completions from OpenAI
	 * @param options Request options
	 * @returns Async iterable of response chunks
	 */
	async *streamComplete(options) {
		try {
			// Prepare request body
			const messages = [];
			// Add system message if provided
			if (options.systemPrompt) {
				messages.push({
					role: 'system',
					content: options.systemPrompt,
				});
			}
			// Add conversation messages
			messages.push(...options.messages);
			// Build request payload
			const requestBody = {
				model: this.model,
				messages,
				temperature: options.temperature ?? this.defaultTemperature,
				max_tokens: options.maxTokens ?? this.defaultMaxTokens,
				stream: true,
			};
			// Add tools if provided
			if (options.tools && options.tools.length > 0) {
				requestBody.tools = options.tools;
			}
			// Add stop sequences if provided
			if (options.stop && options.stop.length > 0) {
				requestBody.stop = options.stop;
			}
			// Make API request
			const response = await fetch(`${this.baseUrl}/chat/completions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.apiKey}`,
				},
				body: JSON.stringify(requestBody),
			});
			// Handle errors
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
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
								const delta = data.choices[0].delta;
								// Yield content chunks
								if (delta.content) {
									yield { content: delta.content };
								}
								// Yield tool call chunks (simplified)
								if (delta.tool_calls) {
									// In a real implementation, you'd need to buffer tool calls
									// until complete across multiple chunks
									yield { toolCalls: [] };
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
			console.error('OpenAI streaming error:', error);
			throw error;
		}
	}
	/**
	 * Estimate token count for text or messages
	 * This is an approximation as actual tokenization depends on OpenAI's tokenizer
	 * @param textOrMessages Text or array of messages
	 * @returns Promise resolving to token count
	 */
	async countTokens(textOrMessages) {
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
