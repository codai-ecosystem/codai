import * as vscode from 'vscode';
import { createLogger } from './loggerService';

export interface AIProvider {
	name: string;
	apiKey: string;
	baseUrl?: string;
	model?: string;
}

export interface AIResponse {
	content: string;
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
	model?: string;
}

export interface AIMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

/**
 * AI Service for handling different AI providers
 * Supports OpenAI, Azure OpenAI, and Anthropic
 */
export class AIService {
	private logger = createLogger('AIService');
	private context: vscode.ExtensionContext;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
	}

	/**
	 * Get the configured AI provider
	 */
	private async getProvider(): Promise<AIProvider | null> {
		const config = vscode.workspace.getConfiguration('aide');
		const provider = config.get<string>('aiProvider', 'openai');

		// Try to get API key from secure storage first, then config
		let apiKey = await this.context.secrets.get(`aide.${provider}.apiKey`);
		if (!apiKey) {
			apiKey = config.get<string>(`${provider}ApiKey`, '');
		}

		if (!apiKey) {
			this.logger.warn(`No API key found for provider: ${provider}`);
			return null;
		}

		const providerConfig: AIProvider = {
			name: provider,
			apiKey,
			model: config.get<string>(`${provider}Model`)
		};

		// Set provider-specific defaults
		switch (provider) {
			case 'openai':
				providerConfig.baseUrl = 'https://api.openai.com/v1';
				providerConfig.model = providerConfig.model || 'gpt-4';
				break;
			case 'azure':
				providerConfig.baseUrl = config.get<string>('azureEndpoint');
				providerConfig.model = providerConfig.model || 'gpt-4';
				break;
			case 'anthropic':
				providerConfig.baseUrl = 'https://api.anthropic.com/v1';
				providerConfig.model = providerConfig.model || 'claude-3-sonnet-20240229';
				break;
		}

		return providerConfig;
	}

	/**
	 * Get the current AI provider name
	 */
	getCurrentProvider(): string {
		const config = vscode.workspace.getConfiguration('aide');
		return config.get<string>('aiProvider', 'openai');
	}

	/**
	 * Switch to a different AI provider
	 */
	async switchProvider(provider: string): Promise<void> {
		const config = vscode.workspace.getConfiguration('aide');
		await config.update('aiProvider', provider, vscode.ConfigurationTarget.Workspace);
		this.logger.info(`Switched AI provider to: ${provider}`);
	}

	/**
	 * Generate a response using the configured AI provider
	 */
	async generateResponse(
		messages: AIMessage[],
		maxTokens: number = 2000,
		temperature: number = 0.7
	): Promise<AIResponse> {
		const provider = await this.getProvider();

		if (!provider) {
			throw new Error('No AI provider configured. Please set up your API keys in AIDE settings.');
		}

		switch (provider.name) {
			case 'openai':
			case 'azure':
				return await this.callOpenAI(provider, messages, maxTokens, temperature);
			case 'anthropic':
				return await this.callAnthropic(provider, messages, maxTokens, temperature);
			default:
				throw new Error(`Unsupported AI provider: ${provider.name}`);
		}
	}

	/**
	 * Call OpenAI or Azure OpenAI API
	 */
	private async callOpenAI(
		provider: AIProvider,
		messages: AIMessage[],
		maxTokens: number,
		temperature: number
	): Promise<AIResponse> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json'
		};

		// Set authorization header based on provider
		if (provider.name === 'azure') {
			headers['api-key'] = provider.apiKey;
		} else {
			headers['Authorization'] = `Bearer ${provider.apiKey}`;
		}

		const body = {
			model: provider.model,
			messages,
			max_tokens: maxTokens,
			temperature,
			stream: false
		};

		try {
			const response = await fetch(`${provider.baseUrl}/chat/completions`, {
				method: 'POST',
				headers,
				body: JSON.stringify(body)
			});

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`AI API request failed: ${response.status} ${error}`);
			}			const data = await response.json() as any;

			return {
				content: data.choices[0].message.content,
				usage: data.usage ? {
					promptTokens: data.usage.prompt_tokens,
					completionTokens: data.usage.completion_tokens,
					totalTokens: data.usage.total_tokens
				} : undefined,
				model: data.model
			};

		} catch (error) {
			this.logger.error('OpenAI API call failed:', error);
			throw new Error(`Failed to get AI response: ${error}`);
		}
	}

	/**
	 * Call Anthropic Claude API
	 */
	private async callAnthropic(
		provider: AIProvider,
		messages: AIMessage[],
		maxTokens: number,
		temperature: number
	): Promise<AIResponse> {
		const headers = {
			'Content-Type': 'application/json',
			'x-api-key': provider.apiKey,
			'anthropic-version': '2023-06-01'
		};

		// Convert messages format for Anthropic
		let systemMessage = '';
		const anthropicMessages = messages.filter(msg => {
			if (msg.role === 'system') {
				systemMessage = msg.content;
				return false;
			}
			return true;
		});

		const body: any = {
			model: provider.model,
			messages: anthropicMessages,
			max_tokens: maxTokens,
			temperature
		};

		if (systemMessage) {
			body.system = systemMessage;
		}

		try {
			const response = await fetch(`${provider.baseUrl}/messages`, {
				method: 'POST',
				headers,
				body: JSON.stringify(body)
			});

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`Anthropic API request failed: ${response.status} ${error}`);
			}			const data = await response.json() as any;

			return {
				content: data.content[0].text,
				usage: data.usage ? {
					promptTokens: data.usage.input_tokens,
					completionTokens: data.usage.output_tokens,
					totalTokens: data.usage.input_tokens + data.usage.output_tokens
				} : undefined,
				model: data.model
			};

		} catch (error) {
			this.logger.error('Anthropic API call failed:', error);
			throw new Error(`Failed to get AI response: ${error}`);
		}
	}

	/**
	 * Set up API key for a provider
	 */
	async setupApiKey(provider: string, apiKey: string): Promise<void> {
		if (!apiKey) {
			throw new Error('API key cannot be empty');
		}

		// Store in secure storage
		await this.context.secrets.store(`aide.${provider}.apiKey`, apiKey);
		this.logger.info(`API key stored securely for provider: ${provider}`);

		// Update configuration
		const config = vscode.workspace.getConfiguration('aide');
		await config.update('aiProvider', provider, vscode.ConfigurationTarget.Global);

		vscode.window.showInformationMessage(`✅ ${provider.toUpperCase()} API key configured successfully!`);
	}

	/**
	 * Test the AI connection
	 */
	async testConnection(): Promise<boolean> {
		try {
			const response = await this.generateResponse([
				{ role: 'user', content: 'Say "Hello, AIDE!" to test the connection.' }
			], 50, 0);

			this.logger.info('AI connection test successful:', response);
			vscode.window.showInformationMessage('✅ AI connection test successful!');
			return true;

		} catch (error) {
			this.logger.error('AI connection test failed:', error);
			vscode.window.showErrorMessage(`❌ AI connection test failed: ${error}`);
			return false;
		}
	}

	/**
	 * Get available providers
	 */
	getAvailableProviders(): string[] {
		return ['openai', 'azure', 'anthropic'];
	}

	/**
	 * Check if AI is properly configured
	 */
	async isConfigured(): Promise<boolean> {
		const provider = await this.getProvider();
		return provider !== null;
	}
}
