const path = require('path');

/** @type {import('webpack').Configuration} */
module.exports = {
	target: 'node',
	mode: 'none', // This leaves the source code as close as possible to the original (when packaging we set this to 'production')
	entry: './src/extension.ts',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'extension.js',
		libraryTarget: 'commonjs2'
	},
	externals: {
		vscode: 'commonjs vscode' // The vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed
	},
	resolve: {
		extensions: ['.ts', '.js']
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader'
					}
				]
			}
		]
	},
	devtool: 'nosources-source-map',
	infrastructureLogging: {
		level: "log", // Enables logging required for problem matchers
	},
};
