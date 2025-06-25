/**
 * Custom error types for AIDE Core
 * Provides specific error classification for better error handling and debugging
 */

export abstract class AIDeError extends Error {
	public readonly code: string;
	public readonly category: string;
	public readonly timestamp: Date;
	public readonly context?: Record<string, any>;

	constructor(message: string, code: string, category: string, context?: Record<string, any>) {
		super(message);
		this.name = this.constructor.name;
		this.code = code;
		this.category = category;
		this.timestamp = new Date();
		this.context = context;

		// Maintains proper stack trace for where our error was thrown
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	public toJSON(): Record<string, any> {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			category: this.category,
			timestamp: this.timestamp.toISOString(),
			context: this.context,
			stack: this.stack,
		};
	}
}

/**
 * Plugin-related errors
 */
export class PluginError extends AIDeError {
	constructor(message: string, code: string = 'PLUGIN_ERROR', context?: Record<string, any>) {
		super(message, code, 'Plugin', context);
	}

	static pluginNotFound(pluginId: string): PluginError {
		return new PluginError(`Plugin '${pluginId}' not found`, 'PLUGIN_NOT_FOUND', { pluginId });
	}

	static pluginLoadFailed(pluginId: string, reason: string): PluginError {
		return new PluginError(`Failed to load plugin '${pluginId}': ${reason}`, 'PLUGIN_LOAD_FAILED', {
			pluginId,
			reason,
		});
	}

	static invalidManifest(pluginId: string, validationErrors: string[]): PluginError {
		return new PluginError(
			`Invalid plugin manifest for '${pluginId}': ${validationErrors.join(', ')}`,
			'INVALID_MANIFEST',
			{ pluginId, validationErrors }
		);
	}
}

/**
 * Build and project creation errors
 */
export class BuildError extends AIDeError {
	constructor(message: string, code: string = 'BUILD_ERROR', context?: Record<string, any>) {
		super(message, code, 'Build', context);
	}

	static workspaceNotFound(): BuildError {
		return new BuildError('No workspace folder found', 'WORKSPACE_NOT_FOUND');
	}

	static packageJsonNotFound(): BuildError {
		return new BuildError(
			'package.json not found. Please initialize a Node.js project first.',
			'PACKAGE_JSON_NOT_FOUND'
		);
	}

	static compilationFailed(errors: string[]): BuildError {
		return new BuildError(`Compilation failed: ${errors.join(', ')}`, 'COMPILATION_FAILED', {
			errors,
		});
	}

	static dependencyInstallFailed(dependency: string, reason: string): BuildError {
		return new BuildError(
			`Failed to install dependency '${dependency}': ${reason}`,
			'DEPENDENCY_INSTALL_FAILED',
			{ dependency, reason }
		);
	}
}

/**
 * Deployment-related errors
 */
export class DeploymentError extends AIDeError {
	constructor(message: string, code: string = 'DEPLOYMENT_ERROR', context?: Record<string, any>) {
		super(message, code, 'Deployment', context);
	}

	static targetNotFound(targetName: string): DeploymentError {
		return new DeploymentError(`Deployment target '${targetName}' not found`, 'TARGET_NOT_FOUND', {
			targetName,
		});
	}

	static unsupportedProvider(provider: string): DeploymentError {
		return new DeploymentError(
			`Unsupported deployment provider: ${provider}`,
			'UNSUPPORTED_PROVIDER',
			{ provider }
		);
	}

	static deploymentFailed(targetName: string, reason: string): DeploymentError {
		return new DeploymentError(
			`Deployment to '${targetName}' failed: ${reason}`,
			'DEPLOYMENT_FAILED',
			{ targetName, reason }
		);
	}
}

/**
 * GitHub service errors
 */
export class GitHubError extends AIDeError {
	constructor(message: string, code: string = 'GITHUB_ERROR', context?: Record<string, any>) {
		super(message, code, 'GitHub', context);
	}

	static notAuthenticated(): GitHubError {
		return new GitHubError('GitHub service not authenticated', 'NOT_AUTHENTICATED');
	}

	static repositoryNotFound(repository: string): GitHubError {
		return new GitHubError(`Repository '${repository}' not found`, 'REPOSITORY_NOT_FOUND', {
			repository,
		});
	}

	static apiError(operation: string, statusCode?: number, apiMessage?: string): GitHubError {
		return new GitHubError(
			`GitHub API error during ${operation}: ${apiMessage || 'Unknown error'}`,
			'API_ERROR',
			{ operation, statusCode, apiMessage }
		);
	}
}

/**
 * Memory and agent-related errors
 */
export class AgentError extends AIDeError {
	constructor(message: string, code: string = 'AGENT_ERROR', context?: Record<string, any>) {
		super(message, code, 'Agent', context);
	}

	static agentNotFound(agentType: string): AgentError {
		return new AgentError(`Agent of type '${agentType}' not found`, 'AGENT_NOT_FOUND', {
			agentType,
		});
	}

	static processingFailed(agentType: string, reason: string): AgentError {
		return new AgentError(
			`Agent '${agentType}' processing failed: ${reason}`,
			'PROCESSING_FAILED',
			{ agentType, reason }
		);
	}

	static timeoutError(agentType: string, timeoutMs: number): AgentError {
		return new AgentError(`Agent '${agentType}' timed out after ${timeoutMs}ms`, 'TIMEOUT', {
			agentType,
			timeoutMs,
		});
	}
}

/**
 * Version management errors
 */
export class VersionError extends AIDeError {
	constructor(message: string, code: string = 'VERSION_ERROR', context?: Record<string, any>) {
		super(message, code, 'Version', context);
	}

	static invalidVersion(version: string): VersionError {
		return new VersionError(`Invalid version format: ${version}`, 'INVALID_VERSION', { version });
	}

	static versionHistoryCorrupted(): VersionError {
		return new VersionError('Version history file is corrupted', 'HISTORY_CORRUPTED');
	}
}

/**
 * File system and I/O errors
 */
export class FileSystemError extends AIDeError {
	constructor(message: string, code: string = 'FILESYSTEM_ERROR', context?: Record<string, any>) {
		super(message, code, 'FileSystem', context);
	}

	static fileNotFound(filePath: string): FileSystemError {
		return new FileSystemError(`File not found: ${filePath}`, 'FILE_NOT_FOUND', { filePath });
	}

	static readError(filePath: string, reason: string): FileSystemError {
		return new FileSystemError(`Failed to read file '${filePath}': ${reason}`, 'READ_ERROR', {
			filePath,
			reason,
		});
	}

	static writeError(filePath: string, reason: string): FileSystemError {
		return new FileSystemError(`Failed to write file '${filePath}': ${reason}`, 'WRITE_ERROR', {
			filePath,
			reason,
		});
	}
}

/**
 * Configuration and validation errors
 */
export class ConfigurationError extends AIDeError {
	constructor(
		message: string,
		code: string = 'CONFIGURATION_ERROR',
		context?: Record<string, any>
	) {
		super(message, code, 'Configuration', context);
	}

	static invalidConfiguration(configPath: string, reason: string): ConfigurationError {
		return new ConfigurationError(
			`Invalid configuration in '${configPath}': ${reason}`,
			'INVALID_CONFIG',
			{ configPath, reason }
		);
	}

	static missingRequiredSetting(setting: string): ConfigurationError {
		return new ConfigurationError(`Required setting '${setting}' is missing`, 'MISSING_SETTING', {
			setting,
		});
	}
}

/**
 * Error factory for creating errors from generic Error objects
 */
export class ErrorFactory {
	static createFromError(error: Error, category: string = 'Unknown'): AIDeError {
		if (error instanceof AIDeError) {
			return error;
		}

		// Try to classify the error based on message patterns
		const message = error.message.toLowerCase();

		if (message.includes('timeout')) {
			return new AgentError(error.message, 'TIMEOUT', { originalError: error.name });
		}

		if (message.includes('not found') || message.includes('enoent')) {
			return new FileSystemError(error.message, 'FILE_NOT_FOUND', { originalError: error.name });
		}

		if (message.includes('permission') || message.includes('eacces')) {
			return new FileSystemError(error.message, 'PERMISSION_DENIED', { originalError: error.name });
		}

		// Generic error wrapper
		class GenericAIDeError extends AIDeError {}
		return new GenericAIDeError(error.message, 'GENERIC_ERROR', category, {
			originalError: error.name,
			originalStack: error.stack,
		});
	}
}
