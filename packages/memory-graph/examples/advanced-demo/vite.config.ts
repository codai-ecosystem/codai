import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
	plugins: [react()],
	server: {
		port: 3002
	},
	resolve: {
		alias: {
			'@aide/memory-graph': path.resolve(__dirname, '../../src'),
			'@aide/agent-runtime': path.resolve(__dirname, '../../../agent-runtime/src'),
			'@': path.resolve(__dirname, 'src')
		}
	},
	optimizeDeps: {
		include: ['react', 'react-dom']
	}
});
