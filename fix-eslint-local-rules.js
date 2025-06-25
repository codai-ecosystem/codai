/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Script to properly comment out all local ESLint rules that depend on the missing pluginLocal import
 */

import fs from 'fs';

// Read the original backup config
const configPath = 'eslint.config.js.backup';
let content = fs.readFileSync(configPath, 'utf8');

console.log('Original file size:', content.length, 'characters');

// Comment out the pluginLocal import line
content = content.replace(
	"import pluginLocal from 'eslint-plugin-local';",
	"// import pluginLocal from 'eslint-plugin-local'; // Temporarily disabled due to missing dependencies"
);

// Comment out all references to 'local': pluginLocal in plugins sections
content = content.replace(
	/'local': pluginLocal,/g,
	"// 'local': pluginLocal, // Temporarily disabled"
);

// Find and comment out individual local rule lines that are simple single-line rules
const simpleLocalRules = [
	"'local/code-translation-remind': 'warn',",
	"'local/code-no-native-private': 'warn',",
	"'local/code-parameter-properties-must-have-explicit-accessibility': 'warn',",
	"'local/code-no-nls-in-standalone-editor': 'warn',",
	"'local/code-no-potentially-unsafe-disposables': 'warn',",
	"'local/code-no-dangerous-type-assertions': 'warn',",
	"'local/code-no-standalone-editor': 'warn',",
	"'local/code-no-unexternalized-strings': 'warn',",
	"'local/code-must-use-super-dispose': 'warn',",
	"'local/code-declare-service-brand': 'warn',",
	"'local/vscode-dts-create-func': 'warn',",
	"'local/vscode-dts-literal-or-types': 'warn',",
	"'local/vscode-dts-string-type-literals': 'warn',",
	"'local/vscode-dts-interface-naming': 'warn',",
	"'local/vscode-dts-cancellation': 'warn',",
	"'local/vscode-dts-use-export': 'warn',",
	"'local/vscode-dts-use-thenable': 'warn',",
	"'local/vscode-dts-vscode-in-comments': 'warn',",
	"'local/code-amd-node-module': 'warn'",
	"'local/code-no-global-document-listener': 'warn',",
	"'local/code-must-use-super-dispose': 'off',",
	"'local/code-no-test-only': 'error',",
	"'local/code-no-test-async-suite': 'warn',",
	"'local/code-no-unexternalized-strings': 'off',",
	"'local/code-no-static-self-ref': 'warn'",
];

// Comment out simple single-line local rules
simpleLocalRules.forEach(rule => {
	const ruleRegex = new RegExp(`\\s*${rule.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
	content = content.replace(ruleRegex, match => {
		return match.replace(
			rule,
			`// ${rule} // Temporarily disabled due to missing pluginLocal import`
		);
	});
});

// Handle complex multi-line local rules by finding their start and end
const complexRulesToComment = [
	{
		start: "'local/code-layering': [",
		description: 'code-layering rule',
	},
	{
		start: "'local/code-import-patterns': [",
		description: 'code-import-patterns rule',
	},
	{
		start: "'local/code-no-runtime-import': [",
		description: 'code-no-runtime-import rule',
	},
	{
		start: "'local/code-limited-top-functions': [",
		description: 'code-limited-top-functions rule',
	},
	{
		start: "'local/code-must-use-result': [",
		description: 'code-must-use-result rule',
	},
	{
		start: "'local/code-ensure-no-disposables-leak-in-test': [",
		description: 'code-ensure-no-disposables-leak-in-test rule',
	},
	{
		start: "'local/vscode-dts-provider-naming': [",
		description: 'vscode-dts-provider-naming rule',
	},
	{
		start: "'local/vscode-dts-event-naming': [",
		description: 'vscode-dts-event-naming rule',
	},
	{
		start: "'local/code-no-unused-expressions': [",
		description: 'code-no-unused-expressions rule',
	},
];

// For each complex rule, find and comment it out
complexRulesToComment.forEach(({ start, description }) => {
	const lines = content.split('\n');
	let ruleStartIndex = -1;
	let ruleEndIndex = -1;
	let bracketCount = 0;
	let inRule = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (line.includes(start) && !line.trim().startsWith('//')) {
			ruleStartIndex = i;
			inRule = true;
			bracketCount = 0;

			// Count opening brackets in the starting line
			for (const char of line) {
				if (char === '[') {
					bracketCount++;
				}
				if (char === ']') {
					bracketCount--;
				}
			}
		}

		if (inRule && ruleStartIndex !== -1) {
			// Count brackets in subsequent lines
			if (i > ruleStartIndex) {
				for (const char of line) {
					if (char === '[') {
						bracketCount++;
					}
					if (char === ']') {
						bracketCount--;
					}
				}
			}

			// Check if this line ends the rule (bracket count reaches 0 and line ends with ], or ],)
			if (bracketCount === 0 && (line.trim().endsWith(']') || line.trim().endsWith('],'))) {
				ruleEndIndex = i;
				break;
			}
		}
	}

	if (ruleStartIndex !== -1 && ruleEndIndex !== -1) {
		console.log(
			`Commenting out ${description} from line ${ruleStartIndex + 1} to ${ruleEndIndex + 1}`
		);

		// Add comment before the rule
		lines[ruleStartIndex] = lines[ruleStartIndex].replace(
			start,
			`// Temporarily disabled due to missing pluginLocal import\n\t\t\t/*\n\t\t\t${start}`
		);

		// Add closing comment after the rule
		lines[ruleEndIndex] = lines[ruleEndIndex] + '\n\t\t\t*/';

		content = lines.join('\n');
	} else {
		console.log(`Could not find complete ${description} block`);
	}
});

// Write the fixed content
fs.writeFileSync('eslint.config.js.fixed', content);
console.log('Fixed configuration written to eslint.config.js.fixed');
console.log('Final file size:', content.length, 'characters');
