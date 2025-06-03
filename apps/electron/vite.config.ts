/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
	plugins: [react()],
	root: resolve(__dirname, 'src/renderer'),
	base: './',
	build: {
		outDir: resolve(__dirname, 'dist/renderer'),
		emptyOutDir: true,
		rollupOptions: {
			external: ['electron']
		}
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src/renderer'),
			'@aide/memory-graph': resolve(__dirname, '../../packages/memory-graph/src'),
			'@aide/agent-runtime': resolve(__dirname, '../../packages/agent-runtime/src'),
			'@aide/ui-components': resolve(__dirname, '../../packages/ui-components/src')
		}
	},
	define: {
		'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
	},
	server: {
		port: 5173
	}
});
