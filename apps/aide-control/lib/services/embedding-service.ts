import { ServiceConfig } from '../types';

/**
 * Interface for embedding services
 */
export interface EmbeddingService {
	providerId: string;
	mode: 'managed' | 'self-managed';
	generateEmbedding(text: string, model?: string): Promise<number[]>;
	generateEmbeddings(texts: string[], model?: string): Promise<number[][]>;
	getUsageCost(inputTokens: number, model?: string): number;
}

/**
 * OpenAI Embedding Service Implementation
 */
class OpenAIEmbeddingService implements EmbeddingService {
	public readonly providerId = 'openai';
	public readonly mode: 'managed' | 'self-managed';
	private apiKey: string;
	private baseUrl: string;

	constructor(config: ServiceConfig) {
		this.mode = config.mode;
		this.apiKey = config.apiKey || '';
		this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';

		if (!this.apiKey) {
			throw new Error('OpenAI API key is required');
		}
	}

	async generateEmbedding(text: string, model = 'text-embedding-3-small'): Promise<number[]> {
		const response = await fetch(`${this.baseUrl}/embeddings`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model,
				input: text,
			}),
		});

		if (!response.ok) {
			throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return data.data[0]?.embedding || [];
	}

	async generateEmbeddings(texts: string[], model = 'text-embedding-3-small'): Promise<number[][]> {
		const response = await fetch(`${this.baseUrl}/embeddings`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model,
				input: texts,
			}),
		});

		if (!response.ok) {
			throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return data.data.map((item: any) => item.embedding);
	}

	getUsageCost(inputTokens: number, model = 'text-embedding-3-small'): number {
		// OpenAI embedding pricing in cents per 1K tokens (as of 2024)
		const pricing: Record<string, number> = {
			'text-embedding-3-small': 0.002,
			'text-embedding-3-large': 0.013,
			'text-embedding-ada-002': 0.01,
		};

		const pricePerToken = pricing[model] || pricing['text-embedding-3-small'];
		const cost = (inputTokens / 1000) * pricePerToken;

		return Math.round(cost * 100); // Return in cents
	}
}

/**
 * Azure OpenAI Embedding Service Implementation
 */
class AzureOpenAIEmbeddingService implements EmbeddingService {
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

	async generateEmbedding(text: string, model = 'text-embedding-3-small'): Promise<number[]> {
		const deploymentName = model;
		const url = `${this.endpoint}/openai/deployments/${deploymentName}/embeddings?api-version=${this.apiVersion}`;

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'api-key': this.apiKey,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				input: text,
			}),
		});

		if (!response.ok) {
			throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return data.data[0]?.embedding || [];
	}

	async generateEmbeddings(texts: string[], model = 'text-embedding-3-small'): Promise<number[][]> {
		const deploymentName = model;
		const url = `${this.endpoint}/openai/deployments/${deploymentName}/embeddings?api-version=${this.apiVersion}`;

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'api-key': this.apiKey,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				input: texts,
			}),
		});

		if (!response.ok) {
			throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return data.data.map((item: any) => item.embedding);
	}

	getUsageCost(inputTokens: number, model = 'text-embedding-3-small'): number {
		// Azure OpenAI embedding pricing in cents per 1K tokens (as of 2024)
		const pricing: Record<string, number> = {
			'text-embedding-3-small': 0.002,
			'text-embedding-3-large': 0.013,
			'text-embedding-ada-002': 0.01,
		};

		const pricePerToken = pricing[model] || pricing['text-embedding-3-small'];
		const cost = (inputTokens / 1000) * pricePerToken;

		return Math.round(cost * 100); // Return in cents
	}
}

/**
 * Factory to create embedding service instances based on provider ID
 */
export function createEmbeddingService(config: ServiceConfig): EmbeddingService {
	switch (config.providerId) {
		case 'openai':
			return new OpenAIEmbeddingService(config);
		case 'azure':
			return new AzureOpenAIEmbeddingService(config);
		default:
			throw new Error(`Unsupported embedding provider: ${config.providerId}`);
	}
}
