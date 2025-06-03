import * as assert from 'assert';
import * as sinon from 'sinon';
import * as path from 'path';
import * as fs from 'fs';
import { ServerManager } from '../../src/services/serverManager';

describe('ServerManager Functionality', () => {
	let sandbox: sinon.SinonSandbox;
	let serverManager: ServerManager;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		serverManager = new ServerManager();
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('generatePackageJson', () => {
		it('should generate package.json with correct fields', () => {
			const name = 'test-api';
			const description = 'Test API server';

			const packageJson = serverManager.generatePackageJson(name, description);
			const parsed = JSON.parse(packageJson);

			assert.strictEqual(parsed.name, 'test-api');
			assert.strictEqual(parsed.description, description);
			assert.strictEqual(parsed.version, '1.0.0');
			assert.ok(parsed.scripts);
			assert.ok(parsed.dependencies);
			assert.ok(parsed.scripts.start);
		});

		it('should convert spaces to hyphens in name', () => {
			const name = 'Test API';
			const description = 'Test API server';

			const packageJson = serverManager.generatePackageJson(name, description);
			const parsed = JSON.parse(packageJson);

			assert.strictEqual(parsed.name, 'test-api');
		});
	}); describe('generateExpressServerCode', () => {
		it('should generate Express server code', () => {
			const port = 3000;

			const code = serverManager.generateExpressServerCode(port);

			assert.ok(code.includes('const express = require'));
			assert.ok(code.includes(`const PORT = ${port}`));
			assert.ok(code.includes('app.listen'));
		}); it('should generate NestJS server code', () => {
			const port = 3000;

			const code = serverManager.generateNestJsServerCode(port);

			assert.ok(code.includes('import { NestFactory }'));
			assert.ok(code.includes('bootstrap'));
			assert.ok(code.includes(`await app.listen(${port})`));
		});
	}); describe('startDevServer', () => {
		it('should start a dev server and return server info', async () => {
			const projectPath = 'test-api';
			const port = '3000';

			const execStub = sandbox.stub().resolves({ stdout: 'Server started' });
			sandbox.stub(require('child_process'), 'exec').value(execStub);

			const result = await serverManager.startDevServer(projectPath, port);

			assert.strictEqual(result.projectPath, projectPath);
			assert.strictEqual(result.status, 'running');
			assert.ok(result.id);
			assert.ok(result.url);
			assert.ok(result.command);
			assert.ok(result.startTime);
		});
	});
});
