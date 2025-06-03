import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { createLogger } from './loggerService';
import { withTimeout } from '../utils/asyncUtils';

/**
 * ServerManager class for handling server-related operations
 * Extracted from BuilderAgent to improve maintainability
 */
export class ServerManager {
	private readonly logger = createLogger('ServerManager');
	private workspaceRoot: string | undefined;
	private activeServers: Map<string, ServerInfo> = new Map();

	constructor() {
		this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		this.logger.debug(`ServerManager initialized with workspace root: ${this.workspaceRoot}`);
	}

	/**
	 * Generate package.json for a server project
	 * @param name Server project name
	 * @param description Server project description
	 */
	public generatePackageJson(name: string, description: string): string {
		return JSON.stringify({
			"name": this.kebabCase(name),
			"version": "1.0.0",
			"description": description || `${name} API server`,
			"main": "dist/index.js",
			"scripts": {
				"start": "node dist/index.js",
				"dev": "nodemon --exec ts-node src/index.ts",
				"build": "tsc",
				"test": "jest",
				"lint": "eslint src/**/*.ts"
			},
			"dependencies": {
				"express": "^4.18.2",
				"cors": "^2.8.5",
				"helmet": "^7.0.0",
				"morgan": "^1.10.0",
				"dotenv": "^16.0.3"
			},
			"devDependencies": {
				"@types/express": "^4.17.17",
				"@types/cors": "^2.8.13",
				"@types/morgan": "^1.9.4",
				"@types/node": "^20.2.5",
				"@types/jest": "^29.5.2",
				"typescript": "^5.0.4",
				"ts-node": "^10.9.1",
				"nodemon": "^2.0.22",
				"jest": "^29.5.0",
				"ts-jest": "^29.1.0",
				"eslint": "^8.41.0",
				"@typescript-eslint/eslint-plugin": "^5.59.9",
				"@typescript-eslint/parser": "^5.59.9"
			}
		}, null, 2);
	}

	/**
	 * Generate tsconfig.json for a server project
	 */
	public generateTsConfig(): string {
		return JSON.stringify({
			"compilerOptions": {
				"target": "ES2022",
				"module": "CommonJS",
				"outDir": "./dist",
				"rootDir": "./src",
				"strict": true,
				"esModuleInterop": true,
				"skipLibCheck": true,
				"forceConsistentCasingInFileNames": true,
				"resolveJsonModule": true
			},
			"include": ["src/**/*"],
			"exclude": ["node_modules", "**/*.test.ts"]
		}, null, 2);
	}

	/**
	 * Generate a .env file for a server project
	 * @param port Server port
	 */
	public generateDotEnv(port: number = 3000): string {
		return `# Server Configuration
PORT=${port}
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=db_name
DB_USER=postgres
DB_PASSWORD=postgres

# Authentication
JWT_SECRET=change_this_secret_in_production
JWT_EXPIRY=1d

# Logging
LOG_LEVEL=debug
`;
	}

	/**
	 * Start a dev server for the project
	 * @param projectPath Path to the project
	 * @param command Command to run the server
	 */
	public async startDevServer(projectPath: string, command: string): Promise<ServerInfo> {
		this.logger.info(`Starting dev server for ${projectPath} with command: ${command}`);

		// Implementation would launch the actual server process
		// This is a simplified version for the refactoring example
		const serverInfo: ServerInfo = {
			id: `server_${Date.now()}`,
			projectPath,
			command,
			url: 'http://localhost:3000',
			status: 'running',
			startTime: new Date(),
			pid: 12345 // Mock PID
		};

		this.activeServers.set(serverInfo.id, serverInfo);
		return serverInfo;
	}

	/**
	 * Stop a running server
	 * @param serverId ID of the server to stop
	 */
	public async stopServer(serverId: string): Promise<boolean> {
		const serverInfo = this.activeServers.get(serverId);

		if (!serverInfo) {
			this.logger.warn(`Server ${serverId} not found`);
			return false;
		}

		this.logger.info(`Stopping server ${serverId}`);

		// Implementation would stop the actual server process
		// This is a simplified version for the refactoring example
		serverInfo.status = 'stopped';
		serverInfo.endTime = new Date();

		this.activeServers.set(serverId, serverInfo);
		return true;
	}

	/**
	 * Get the list of active servers
	 */
	public getActiveServers(): ServerInfo[] {
		return Array.from(this.activeServers.values());
	}

	/**
	 * Generate Express server code
	 * @param port Port number
	 */
	public generateExpressServerCode(port: number): string {
		return `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = ${port};

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.use('/api', require('./routes'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
});

module.exports = app;`;
	}

	/**
	 * Generate NestJS server code
	 * @param port Port number
	 */
	public generateNestJsServerCode(port: number): string {
		return `import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors();

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Swagger API docs
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('API documentation for the server')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Start server
  await app.listen(${port});
  console.log(\`Server running on port ${port}\`);
}

bootstrap();`;
	}

	/**
	 * Convert a string to kebab-case
	 * @param str String to convert
	 */
	private kebabCase(str: string): string {
		return str
			.replace(/([a-z])([A-Z])/g, '$1-$2')
			.replace(/[\s_]+/g, '-')
			.toLowerCase();
	}
}

/**
 * Server information interface
 */
export interface ServerInfo {
	id: string;
	projectPath: string;
	command: string;
	url: string;
	status: 'running' | 'stopped' | 'error';
	startTime: Date;
	endTime?: Date;
	pid?: number;
	errorMessage?: string;
}
