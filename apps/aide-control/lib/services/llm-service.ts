import { ServiceConfig } from '../types';

/**
 * Interface for LLM services
 */
export interface LLMService {
	providerId: string;
	mode: 'managed' | 'self-managed';
	generateCompletion(prompt: string, model?: string, options?: any): Promise<string>;
	generateStreamingCompletion(prompt: string, model?: string, options?: any): AsyncIterable<string>;
	getUsageCost(inputTokens: number, outputTokens: number, model?: string): number;
	chat(messages: Array<{ role: string; content: string }>): Promise<string>;
	complete(prompt: string): Promise<string>;
}

/**
 * OpenAI LLM Service Implementation
 */
class OpenAILLMService implements LLMService {
	public readonly providerId = 'openai';
	public readonly mode: 'managed' | 'self-managed';
	private apiKey: string;
	private baseUrl?: string;

	constructor(config: ServiceConfig) {
		this.mode = config.mode;
		this.apiKey = config.apiKey || '';
		this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';

		if (!this.apiKey) {
			throw new Error('OpenAI API key is required');
		}
	}

	async chat(messages: Array<{ role: string; content: string }>): Promise<string> {
		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'gpt-3.5-turbo',
				messages,
			}),
		});

		if (!response.ok) {
			throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return data.choices[0]?.message?.content || '';
	}

	async complete(prompt: string): Promise<string> {
		return this.generateCompletion(prompt);
	}

	async generateCompletion(prompt: string, model = 'gpt-3.5-turbo', options: any = {}): Promise<string> {
		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model,
				messages: [{ role: 'user', content: prompt }],
				...options,
			}),
		});

		if (!response.ok) {
			throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return data.choices[0]?.message?.content || '';
	}

	async *generateStreamingCompletion(prompt: string, model = 'gpt-3.5-turbo', options: any = {}): AsyncIterable<string> {
		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model,
				messages: [{ role: 'user', content: prompt }],
				stream: true,
				...options,
			}),
		});

		if (!response.ok) {
			throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
		}

		const reader = response.body?.getReader();
		const decoder = new TextDecoder();

		if (!reader) {
			throw new Error('Failed to get response reader');
		}

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			const chunk = decoder.decode(value);
			const lines = chunk.split('\n');

			for (const line of lines) {
				if (line.startsWith('data: ')) {
					const data = line.slice(6);
					if (data === '[DONE]') break;

					try {
						const parsed = JSON.parse(data);
						const content = parsed.choices[0]?.delta?.content;
						if (content) {
							yield content;
						}
					} catch (error) {
						// Skip invalid JSON lines
					}
				}
			}
		}
	}

	getUsageCost(inputTokens: number, outputTokens: number, model = 'gpt-3.5-turbo'): number {
		// Pricing in cents per 1K tokens (as of 2024)
		const pricing: Record<string, { input: number; output: number }> = {
			'gpt-3.5-turbo': { input: 0.15, output: 0.20 },
			'gpt-4': { input: 3.0, output: 6.0 },
			'gpt-4-turbo': { input: 1.0, output: 3.0 },
			'gpt-4o': { input: 0.50, output: 1.50 },
			'gpt-4o-mini': { input: 0.015, output: 0.06 },
		};

		const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
		const inputCost = (inputTokens / 1000) * modelPricing.input;
		const outputCost = (outputTokens / 1000) * modelPricing.output;

		return Math.round((inputCost + outputCost) * 100); // Return in cents
	}
}

/**
 * Azure OpenAI implementation of LLM service
 */
class AzureOpenAILLMService implements LLMService {
	public readonly providerId = 'azure';
	public readonly mode: 'managed' | 'self-managed';
	private apiKey: string;
	private endpoint: string;
	private apiVersion: string;
	constructor(config: ServiceConfig) {
		this.mode = config.mode;
		this.apiKey = config.apiKey || '';
		this.endpoint = config.baseUrl || config.additionalConfig?.endpoint || '';
		this.apiVersion = config.additionalConfig?.apiVersion || '2024-02-01';

		if (!this.apiKey) {
			throw new Error('Azure OpenAI API key is required');
		}
		if (!this.endpoint) {
			throw new Error('Azure OpenAI endpoint is required');
		}
	}

	async chat(messages: Array<{ role: string; content: string }>): Promise<string> {
		const deploymentName = 'gpt-35-turbo'; // Default deployment name
		const url = `${this.endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${this.apiVersion}`;

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'api-key': this.apiKey,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				messages,
			}),
		});

		if (!response.ok) {
			throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return data.choices[0]?.message?.content || '';
	}

	async complete(prompt: string): Promise<string> {
		return this.generateCompletion(prompt);
	}

	async generateCompletion(prompt: string, model = 'gpt-35-turbo', options: any = {}): Promise<string> {
		const deploymentName = model;
		const url = `${this.endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${this.apiVersion}`;

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'api-key': this.apiKey,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				messages: [{ role: 'user', content: prompt }],
				...options,
			}),
		});

		if (!response.ok) {
			throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return data.choices[0]?.message?.content || '';
	}

	async *generateStreamingCompletion(prompt: string, model = 'gpt-35-turbo', options: any = {}): AsyncIterable<string> {
		const deploymentName = model;
		const url = `${this.endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${this.apiVersion}`;

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'api-key': this.apiKey,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				messages: [{ role: 'user', content: prompt }],
				stream: true,
				...options,
			}),
		});

		if (!response.ok) {
			throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
		}

		const reader = response.body?.getReader();
		const decoder = new TextDecoder();

		if (!reader) {
			throw new Error('Failed to get response reader');
		}

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			const chunk = decoder.decode(value);
			const lines = chunk.split('\n');

			for (const line of lines) {
				if (line.startsWith('data: ')) {
					const data = line.slice(6);
					if (data === '[DONE]') break;

					try {
						const parsed = JSON.parse(data);
						const content = parsed.choices[0]?.delta?.content;
						if (content) {
							yield content;
						}
					} catch (error) {
						// Skip invalid JSON lines
					}
				}
			}
		}
	}

	getUsageCost(inputTokens: number, outputTokens: number, model = 'gpt-35-turbo'): number {
		// Azure OpenAI pricing in cents per 1K tokens (as of 2024)
		const pricing: Record<string, { input: number; output: number }> = {
			'gpt-35-turbo': { input: 0.15, output: 0.20 },
			'gpt-4': { input: 3.0, output: 6.0 },
			'gpt-4-turbo': { input: 1.0, output: 3.0 },
			'gpt-4o': { input: 0.50, output: 1.50 },
		};

		const modelPricing = pricing[model] || pricing['gpt-35-turbo'];
		const inputCost = (inputTokens / 1000) * modelPricing.input;
		const outputCost = (outputTokens / 1000) * modelPricing.output;

		return Math.round((inputCost + outputCost) * 100); // Return in cents
	}
}

/**
 * Anthropic implementation of LLM service
 */
class AnthropicLLMService implements LLMService {
	public readonly providerId = 'anthropic';
	public readonly mode: 'managed' | 'self-managed';
	private apiKey: string;
	private baseUrl: string;

	constructor(config: ServiceConfig) {
		this.mode = config.mode;
		this.apiKey = config.apiKey || '';
		this.baseUrl = config.baseUrl || 'https://api.anthropic.com';

		if (!this.apiKey) {
			throw new Error('Anthropic API key is required');
		}
	}

	async chat(messages: Array<{ role: string; content: string }>): Promise<string> {
		// Convert messages to Anthropic format
		const systemMessage = messages.find(m => m.role === 'system')?.content || '';
		const userMessages = messages.filter(m => m.role !== 'system');

		const response = await fetch(`${this.baseUrl}/v1/messages`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
				'anthropic-version': '2023-06-01',
			},
			body: JSON.stringify({
				model: 'claude-3-sonnet-20240229',
				max_tokens: 4096,
				system: systemMessage,
				messages: userMessages,
			}),
		});

		if (!response.ok) {
			throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return data.content[0]?.text || '';
	}

	async complete(prompt: string): Promise<string> {
		return this.generateCompletion(prompt);
	}

	async generateCompletion(prompt: string, model = 'claude-3-sonnet-20240229', options: any = {}): Promise<string> {
		const response = await fetch(`${this.baseUrl}/v1/messages`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
				'anthropic-version': '2023-06-01',
			},
			body: JSON.stringify({
				model,
				max_tokens: 4096,
				messages: [{ role: 'user', content: prompt }],
				...options,
			}),
		});

		if (!response.ok) {
			throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return data.content[0]?.text || '';
	}

	async *generateStreamingCompletion(prompt: string, model = 'claude-3-sonnet-20240229', options: any = {}): AsyncIterable<string> {
		const response = await fetch(`${this.baseUrl}/v1/messages`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
				'anthropic-version': '2023-06-01',
			},
			body: JSON.stringify({
				model,
				max_tokens: 4096,
				messages: [{ role: 'user', content: prompt }],
				stream: true,
				...options,
			}),
		});

		if (!response.ok) {
			throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
		}

		const reader = response.body?.getReader();
		const decoder = new TextDecoder();

		if (!reader) {
			throw new Error('Failed to get response reader');
		}

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			const chunk = decoder.decode(value);
			const lines = chunk.split('\n');

			for (const line of lines) {
				if (line.startsWith('data: ')) {
					const data = line.slice(6);
					if (data === '[DONE]') break;

					try {
						const parsed = JSON.parse(data);
						if (parsed.type === 'content_block_delta') {
							const content = parsed.delta?.text;
							if (content) {
								yield content;
							}
						}
					} catch (error) {
						// Skip invalid JSON lines
					}
				}
			}
		}
	}

	getUsageCost(inputTokens: number, outputTokens: number, model = 'claude-3-sonnet-20240229'): number {
		// Anthropic pricing in cents per 1K tokens (as of 2024)
		const pricing: Record<string, { input: number; output: number }> = {
			'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
			'claude-3-sonnet-20240229': { input: 3.0, output: 15.0 },
			'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
			'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
		};

		const modelPricing = pricing[model] || pricing['claude-3-sonnet-20240229'];
		const inputCost = (inputTokens / 1000) * modelPricing.input;
		const outputCost = (outputTokens / 1000) * modelPricing.output;

		return Math.round((inputCost + outputCost) * 100); // Return in cents
	}
}

/**
 * Factory to create LLM service instances based on provider ID
 */
export function createLLMService(config: ServiceConfig): LLMService {
	switch (config.providerId) {
		case 'openai':
			return new OpenAILLMService(config);
		case 'azure':
			return new AzureOpenAILLMService(config);
		case 'anthropic':
			return new AnthropicLLMService(config);
		default:
			throw new Error(`Unsupported LLM provider: ${config.providerId}`);
	}
}
