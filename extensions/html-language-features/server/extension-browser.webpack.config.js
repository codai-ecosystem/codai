/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check

'use strict';

const withBrowserDefaults = require('../../shared.webpack.config').browser;
const path = require('path');

const serverConfig = withBrowserDefaults({
	context: __dirname,
	entry: {
		extension: './src/browser/htmlServerWorkerMain.ts',
	},
	resolve: {
		extensionAlias: {
			// this is needed to resolve dynamic imports that now require the .js extension
			'.js': ['.js', '.ts'],
		},
	},
	output: {
		filename: 'htmlServerMain.js',
		path: path.join(__dirname, 'dist', 'browser'),
		libraryTarget: 'var',
		library: 'serverExportVar',
	},
	optimization: {
		splitChunks: {
			chunks: 'async',
		},
	},
});
serverConfig.module.noParse = /typescript[\/\\]lib[\/\\]typescript\.js/;
serverConfig.module.rules.push({
	test: /javascriptLibs.ts$/,
	use: [
		{
			loader: path.resolve(__dirname, 'build', 'javaScriptLibraryLoader.js'),
		},
	],
});

module.exports = serverConfig;
