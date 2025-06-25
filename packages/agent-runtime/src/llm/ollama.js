/**
 * Adapter for Ollama LLM service
 * Allows integration with locally hosted Ollama models
 */
export class OllamaService {
	constructor(config) {
		this.baseUrl = config.baseUrl || 'http://localhost:11434';
		this.model = config.model;
		this.temperature = config.temperature || 0.7;
		this.maxTokens = config.maxTokens || 2048;
	}
	/**
	 * Convert messages array to a single prompt string
	 */
	messagesToPrompt(messages) {
		return (
			messages
				.map(msg => {
					switch (msg.role) {
						case 'system':
							return `System: ${msg.content}`;
						case 'user':
							return `Human: ${msg.content}`;
						case 'assistant':
							return `Assistant: ${msg.content}`;
						default:
							return `${msg.role}: ${msg.content}`;
					}
				})
				.join('\n\n') + '\n\nAssistant:'
		);
	}
	async complete(options) {
		try {
			const endpoint = `${this.baseUrl}/api/generate`;
			// Convert messages to a single prompt
			const prompt = this.messagesToPrompt(options.messages);
			const requestBody = {
				model: this.model,
				prompt: prompt,
				stream: false,
				options: {
					temperature: options.temperature || this.temperature,
					max_tokens: options.maxTokens || this.maxTokens,
				},
			};
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});
			if (!response.ok) {
				throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
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
			console.error('Ollama completion error:', error);
			throw new Error(
				`Failed to complete with Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}
	async *streamComplete(options) {
		try {
			const endpoint = `${this.baseUrl}/api/generate`;
			// Convert messages to a single prompt
			const prompt = this.messagesToPrompt(options.messages);
			const requestBody = {
				model: this.model,
				prompt: prompt,
				stream: true,
				options: {
					temperature: options.temperature || this.temperature,
					max_tokens: options.maxTokens || this.maxTokens,
				},
			};
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});
			if (!response.ok) {
				throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
			}
			if (!response.body) {
				throw new Error('No response body received from Ollama');
			}
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					const chunk = decoder.decode(value);
					const lines = chunk.split('\n').filter(line => line.trim());
					for (const line of lines) {
						try {
							const data = JSON.parse(line);
							if (data.response) {
								const response = {
									content: data.response,
								};
								if (data.done) {
									response.usage = {
										promptTokens: data.prompt_eval_count || 0,
										completionTokens: data.eval_count || 0,
										totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
									};
								}
								yield response;
							}
							if (data.done) {
								return;
							}
						} catch (parseError) {
							console.warn('Failed to parse streaming response chunk:', parseError);
						}
					}
				}
			} finally {
				reader.releaseLock();
			}
		} catch (error) {
			console.error('Ollama streaming error:', error);
			throw new Error(
				`Failed to stream with Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}
	async countTokens(text) {
		// Ollama doesn't provide a direct token counting API
		// Use a rough approximation: ~4 characters per token for English text
		if (typeof text === 'string') {
			return Math.ceil(text.length / 4);
		} else {
			// For messages, count all content
			const totalLength = text.reduce((acc, msg) => {
				return acc + (msg.content?.length || 0);
			}, 0);
			return Math.ceil(totalLength / 4);
		}
	}
	/**
	 * Check if Ollama service is available
	 */
	async isAvailable() {
		try {
			const response = await fetch(`${this.baseUrl}/api/tags`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});
			return response.ok;
		} catch {
			return false;
		}
	}
	/**
	 * List available models in Ollama
	 */
	async listModels() {
		try {
			const response = await fetch(`${this.baseUrl}/api/tags`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});
			if (!response.ok) {
				throw new Error(`Failed to fetch models: ${response.status}`);
			}
			const data = await response.json();
			return data.models?.map(model => model.name) || [];
		} catch (error) {
			console.error('Failed to list Ollama models:', error);
			return [];
		}
	}
}
