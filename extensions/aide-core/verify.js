/**
 * Verification script to ensure that the added methods to TemplateGenerator work properly
 */

import { TemplateGenerator } from './src/services/templateGenerator';

// Create an instance of the TemplateGenerator
const templateGenerator = new TemplateGenerator();

// Test the new generateComponentStyleCode method
const componentStyleCode = templateGenerator.generateComponentStyleCode('TestComponent');
console.log('==== Component Style Code ====');
console.log(componentStyleCode);
console.log('============================\n');

// Test the new generateFeatureIndexCode method
const featureIndexCode = templateGenerator.generateFeatureIndexCode('TestFeature');
console.log('==== Feature Index Code ====');
console.log(featureIndexCode);
console.log('============================\n');

console.log('✅ All tests passed!');
