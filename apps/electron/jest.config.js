/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export default {
	preset: 'ts-jest',
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: ['<rootDir>/src/renderer/__tests__/setupTests.ts'],
	moduleNameMapping: {
		'^@aide/(.*)$': '<rootDir>/../../packages/$1/dist',
		'\\.(css|less|scss|sass)$': 'identity-obj-proxy',
	},
	extensionsToTreatAsEsm: ['.ts', '.tsx'],
	globals: {
		'ts-jest': {
			useESM: true,
		},
	},
	transform: {
		'^.+\\.(ts|tsx)$': [
			'ts-jest',
			{
				useESM: true,
			},
		],
	},
	testMatch: [
		'<rootDir>/src/**/__tests__/**/*.(ts|tsx)',
		'<rootDir>/src/**/*.(test|spec).(ts|tsx)',
	],
	collectCoverageFrom: ['src/**/*.(ts|tsx)', '!src/**/*.d.ts', '!src/**/__tests__/**'],
};
