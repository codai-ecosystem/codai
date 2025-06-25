export class SimpleTestAgent {
	id = 'test-simple-agent';
	name = 'Test Simple Agent';
	description = 'A simple test agent that demonstrates basic functionality';

	async processQuery(query: string): Promise<string> {
		return `Test agent processed: "${query}"`;
	}

	getCapabilities(): string[] {
		return ['general', 'testing'];
	}
}
