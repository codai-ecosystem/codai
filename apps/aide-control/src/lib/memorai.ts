// Temporary simple fetch implementation for MemorAI integration
export class MemorAIService {
	private apiUrl: string;
	private apiKey: string;
	private agentId: string;

	constructor() {
		this.apiUrl = process.env.MEMORAI_API_URL || 'https://memorai.codai.ro';
		this.apiKey = process.env.MEMORAI_API_KEY || '';
		this.agentId = process.env.MEMORAI_AGENT_ID || 'codai-web-agent';
	}

	private getHeaders() {
		return {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${this.apiKey}`,
			'X-Agent-ID': this.agentId,
		};
	}

	/**
	 * Search memory using MemorAI MCP recall
	 */
	async recall(query: string, limit: number = 10) {
		try {
			const response = await fetch(`${this.apiUrl}/mcp/recall`, {
				method: 'POST',
				headers: this.getHeaders(),
				body: JSON.stringify({
					agentId: this.agentId,
					query,
					limit,
				}),
			});

			if (!response.ok) {
				throw new Error(`MemorAI recall failed: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('MemorAI recall error:', error);
			throw new Error('Failed to recall from MemorAI');
		}
	}

	/**
	 * Store information in MemorAI
	 */
	async remember(content: string, metadata?: Record<string, any>) {
		try {
			const response = await fetch(`${this.apiUrl}/mcp/remember`, {
				method: 'POST',
				headers: this.getHeaders(),
				body: JSON.stringify({
					agentId: this.agentId,
					content,
					metadata: {
						source: 'codai-web',
						timestamp: new Date().toISOString(),
						...metadata,
					},
				}),
			});

			if (!response.ok) {
				throw new Error(`MemorAI remember failed: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('MemorAI remember error:', error);
			throw new Error('Failed to store in MemorAI');
		}
	}

	/**
	 * Forget specific memory
	 */
	async forget(memoryId: string) {
		try {
			const response = await fetch(`${this.apiUrl}/mcp/forget`, {
				method: 'POST',
				headers: this.getHeaders(),
				body: JSON.stringify({
					agentId: this.agentId,
					memoryId,
				}),
			});

			if (!response.ok) {
				throw new Error(`MemorAI forget failed: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('MemorAI forget error:', error);
			throw new Error('Failed to forget from MemorAI');
		}
	}

	/**
	 * Get contextual memory summary
	 */
	async getContext(contextSize: number = 5) {
		try {
			const response = await fetch(`${this.apiUrl}/mcp/context`, {
				method: 'POST',
				headers: this.getHeaders(),
				body: JSON.stringify({
					agentId: this.agentId,
					contextSize,
				}),
			});

			if (!response.ok) {
				throw new Error(`MemorAI context failed: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('MemorAI context error:', error);
			throw new Error('Failed to get context from MemorAI');
		}
	}
}

// Export singleton instance
export const memoraiService = new MemorAIService();
