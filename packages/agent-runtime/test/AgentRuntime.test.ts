import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentRuntime } from '../src/AgentRuntime';
import { MemoryGraphEngine } from '@dragoscatalin/memory-graph';
import { LLMService, LLMResponse } from '../src/llm';

// Mock MemoryGraphEngine
vi.mock('@dragoscatalin/memory-graph', () => {
	return {
		MemoryGraphEngine: vi.fn().mockImplementation(() => ({
			currentGraph: { id: 'test-graph', nodes: [], relationships: [] },
			nodes: [],
			relationships: [],
			saveGraph: vi.fn().mockResolvedValue(true),
			loadGraph: vi.fn().mockResolvedValue(true),
			addNode: vi.fn(),
			updateNode: vi.fn(),
			removeNode: vi.fn(),
			addRelationship: vi.fn(),
			removeRelationship: vi.fn(),
			findNodeById: vi.fn(),
			findNodesByType: vi.fn(),
			findNodesByProperty: vi.fn(),
			findRelationships: vi.fn(),
		})),
	};
});

// Mock LLM service for testing
class MockLLMService implements LLMService {
	async complete(): Promise<LLMResponse> {
		return {
			content: 'This is a mock response from the LLM',
			usage: {
				promptTokens: 10,
				completionTokens: 10,
				totalTokens: 20,
			},
		};
	}

	async *streamComplete(): AsyncIterable<Partial<LLMResponse>> {
		yield { content: 'This ' };
		yield { content: 'is ' };
		yield { content: 'a ' };
		yield { content: 'mock ' };
		yield { content: 'streaming ' };
		yield { content: 'response' };
	}

	async countTokens(): Promise<number> {
		return 10;
	}
}

describe('AgentRuntime', () => {
	let runtime: AgentRuntime;
	let memoryGraph: MemoryGraphEngine;

	beforeEach(() => {
		vi.clearAllMocks();
		memoryGraph = new MemoryGraphEngine();

		// Create AgentRuntime with mock API keys
		runtime = new AgentRuntime(memoryGraph, {
			openai: 'mock-openai-key',
			anthropic: 'mock-anthropic-key',
		});

		// Add a mock LLM service
		(runtime as any).llmServices.set('mock', new MockLLMService());

		// Mock the agents map to include a test agent
		(runtime as any).agents.set('test-agent', {
			config: {
				id: 'test-agent',
				name: 'Test Agent',
				type: 'planner',
				description: 'A test agent',
				capabilities: [],
				aiProvider: {
					provider: 'mock',
					model: 'mock-model',
					temperature: 0.7,
				},
				isEnabled: true,
				priority: 5,
			},
		});
	});

	it('should initialize with memory graph', () => {
		expect(runtime).toBeDefined();
	});

	it('should return available LLM providers', () => {
		const providers = runtime.getAvailableLLMProviders();
		expect(providers).toContain('mock');
	});

	it('should retrieve an LLM service by provider', () => {
		const service = runtime.getLLMService('mock');
		expect(service).toBeInstanceOf(MockLLMService);
	});

	it('should complete an LLM prompt', async () => {
		const response = await runtime.completeLLM('test-agent', 'Test prompt');

		expect(response).toBe('This is a mock response from the LLM');
	});

	it('should handle streaming responses', async () => {
		const contentChunks: string[] = [];

		await runtime.streamChatWithLLM(
			'test-agent',
			[{ role: 'user', content: 'Test prompt' }],
			undefined,
			content => contentChunks.push(content)
		);

		expect(contentChunks.join('')).toBe('This is a mock streaming response');
	});

	it('should throw error for non-existent agent', async () => {
		await expect(runtime.completeLLM('non-existent-agent', 'Test prompt')).rejects.toThrow(
			'Agent non-existent-agent not found'
		);
	});
});
