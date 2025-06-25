import * as assert from 'assert';
import { TemplateGenerator } from '../../src/services/templateGenerator';

describe('TemplateGenerator', () => {
	let templateGenerator: TemplateGenerator;

	beforeEach(() => {
		templateGenerator = new TemplateGenerator();
	});

	describe('generateFunctionCode', () => {
		it('should generate function code with the correct name', () => {
			const functionName = 'testFunction';
			const code = templateGenerator.generateFunctionCode(functionName);

			assert.ok(code.includes(`function ${functionName}`));
			assert.ok(code.includes('export function'));
			assert.ok(code.includes('@param param1'));
			assert.ok(code.includes('@param param2'));
			assert.ok(code.includes('@returns'));
		});
	});
	describe('generateComponentCode', () => {
		it('should generate a React functional component', () => {
			const componentName = 'TestComponent';
			const code = templateGenerator.generateComponentCode(componentName);

			assert.ok(code.includes(`function ${componentName}`));
			assert.ok(code.includes('import React'));
			assert.ok(code.includes('export default'));
			assert.ok(code.includes('<div className='));
		});
	});

	describe('generateComponentStyleCode', () => {
		it('should generate CSS styles for a component', () => {
			const componentName = 'TestComponent';
			const code = templateGenerator.generateComponentStyleCode(componentName);

			assert.ok(code.includes(`.${componentName.toLowerCase()}-container`));
			assert.ok(code.includes('display:'));
			assert.ok(code.includes('margin:'));
			assert.ok(code.includes('padding:'));
		});
	});

	describe('generateFeatureIndexCode', () => {
		it('should generate feature index code', () => {
			const componentName = 'TestComponent';
			const code = templateGenerator.generateFeatureIndexCode(componentName);

			assert.ok(code.includes(`export { default } from './${componentName}'`));
		});
	});
});
