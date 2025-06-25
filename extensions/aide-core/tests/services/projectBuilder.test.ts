import * as assert from 'assert';
import * as sinon from 'sinon';
import { ProjectBuilder } from '../../src/services/projectBuilder';
import { FileManager } from '../../src/services/fileManager';
import { TemplateGenerator } from '../../src/services/templateGenerator';
import { ServerManager } from '../../src/services/serverManager';
import { AgentAction } from '../../src/agents/agentManager';

describe('ProjectBuilder', () => {
	let projectBuilder: ProjectBuilder;
	let fileManagerStub: sinon.SinonStubbedInstance<FileManager>;
	let templateGeneratorStub: sinon.SinonStubbedInstance<TemplateGenerator>;
	let serverManagerStub: sinon.SinonStubbedInstance<ServerManager>;
	let sandbox: sinon.SinonSandbox;

	beforeEach(() => {
		sandbox = sinon.createSandbox();

		// Create stubs for dependencies
		fileManagerStub = sandbox.createStubInstance(FileManager);
		templateGeneratorStub = sandbox.createStubInstance(TemplateGenerator);
		serverManagerStub = sandbox.createStubInstance(ServerManager);

		// Replace the actual instances in the ProjectBuilder with stubs
		projectBuilder = new ProjectBuilder();
		(projectBuilder as any).fileManager = fileManagerStub;
		(projectBuilder as any).templateGenerator = templateGeneratorStub;
		(projectBuilder as any).serverManager = serverManagerStub;
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('buildReactComponent', () => {
		it('should create component files with the correct content', async () => {
			// Setup
			const componentName = 'TestComponent';
			const componentCode = 'React component code';
			const styleCode = 'CSS style code';
			const actions: AgentAction[] = [];

			// Mocks
			templateGeneratorStub.generateComponentCode.returns(componentCode);
			templateGeneratorStub.generateComponentStyleCode.returns(styleCode);

			// Execute
			await projectBuilder.buildComponent(componentName, actions);

			// Verify
			assert.strictEqual(templateGeneratorStub.generateComponentCode.calledOnce, true);
			assert.strictEqual(
				templateGeneratorStub.generateComponentCode.firstCall.args[0],
				componentName
			);

			assert.strictEqual(templateGeneratorStub.generateComponentStyleCode.calledOnce, true);
			assert.strictEqual(
				templateGeneratorStub.generateComponentStyleCode.firstCall.args[0],
				componentName
			);

			// Should create component file
			assert.strictEqual(fileManagerStub.createFile.callCount, 2);

			// Should add actions
			assert.strictEqual(actions.length, 2);
			assert.strictEqual(actions[0].type, 'createFile');
			assert.strictEqual(actions[1].type, 'createFile');
		});
	});
	describe('buildFeature', () => {
		it('should create feature files with the correct structure', async () => {
			// Setup
			const featureName = 'TestFeature';
			const componentCode = 'React component code';
			const styleCode = 'CSS style code';
			const featureIndexCode = 'Feature index code';
			const actions: AgentAction[] = [];

			// Mocks
			templateGeneratorStub.generateComponentCode.returns(componentCode);
			templateGeneratorStub.generateComponentStyleCode.returns(styleCode);
			templateGeneratorStub.generateFeatureIndexCode.returns(featureIndexCode);

			// Execute
			await projectBuilder.buildFeature(featureName, actions);

			// Verify
			assert.strictEqual(templateGeneratorStub.generateComponentCode.calledOnce, true);
			assert.strictEqual(
				templateGeneratorStub.generateComponentCode.firstCall.args[0],
				featureName
			);

			assert.strictEqual(templateGeneratorStub.generateComponentStyleCode.calledOnce, true);
			assert.strictEqual(
				templateGeneratorStub.generateComponentStyleCode.firstCall.args[0],
				featureName
			);

			assert.strictEqual(templateGeneratorStub.generateFeatureIndexCode.calledOnce, true);
			assert.strictEqual(
				templateGeneratorStub.generateFeatureIndexCode.firstCall.args[0],
				featureName
			);

			// Should create files (component, style, index)
			assert.strictEqual(fileManagerStub.createFile.callCount, 3);

			// Should add actions
			assert.strictEqual(actions.length, 3);
			assert.strictEqual(actions[0].type, 'createFile');
			assert.strictEqual(actions[1].type, 'createFile');
			assert.strictEqual(actions[2].type, 'createFile');
		});
	});
});
