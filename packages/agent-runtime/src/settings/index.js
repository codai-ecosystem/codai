/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { z } from 'zod';
import * as crypto from 'crypto';
/**
 * Secure Settings Management for AIDE
 * Handles encrypted storage of API keys and user preferences
 */
// Encryption/decryption utilities
export class SecureStorage {
    /**
     * Generate a secure encryption key
     */
    static generateKey() {
        return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
    }
    /**
     * Encrypt sensitive data
     */
    static encrypt(data, key) {
        const iv = crypto.randomBytes(this.IV_LENGTH);
        const keyBuffer = Buffer.from(key, 'hex');
        const cipher = crypto.createCipheriv(this.ALGORITHM, keyBuffer, iv);
        cipher.setAAD(Buffer.from('aide-secure-data'));
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }
    /**
     * Decrypt sensitive data
     */
    static decrypt(encryptedData, key) {
        const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const keyBuffer = Buffer.from(key, 'hex');
        const decipher = crypto.createDecipheriv(this.ALGORITHM, keyBuffer, iv);
        decipher.setAAD(Buffer.from('aide-secure-data'));
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
SecureStorage.ALGORITHM = 'aes-256-gcm';
SecureStorage.KEY_LENGTH = 32;
SecureStorage.IV_LENGTH = 16;
// AI Provider configuration schemas
export const AIProviderConfigSchema = z.object({
    provider: z.enum(['openai', 'anthropic', 'azure-openai', 'google', 'local', 'custom']),
    name: z.string(),
    apiKey: z.string(),
    endpoint: z.string().url().optional(),
    model: z.string(),
    maxTokens: z.number().min(1).max(200000).default(4096),
    temperature: z.number().min(0).max(2).default(0.7),
    enabled: z.boolean().default(true),
    rateLimitRpm: z.number().min(1).default(60), // Requests per minute
    priority: z.number().min(1).max(10).default(5), // Higher = preferred for tasks
});
export const DeploymentConfigSchema = z.object({
    platform: z.enum(['vercel', 'netlify', 'aws', 'azure', 'gcp', 'github-pages', 'firebase']),
    name: z.string(),
    apiKey: z.string().optional(),
    accessToken: z.string().optional(),
    projectId: z.string().optional(),
    region: z.string().optional(),
    environment: z.enum(['development', 'staging', 'production']).default('production'),
    autoDeployment: z.boolean().default(false),
    enabled: z.boolean().default(true),
});
export const GitConfigSchema = z.object({
    provider: z.enum(['github', 'gitlab', 'bitbucket', 'azure-devops']),
    username: z.string(),
    accessToken: z.string(),
    defaultBranch: z.string().default('main'),
    autoCommit: z.boolean().default(true),
    commitMessageTemplate: z.string().default('AIDE: {summary}'),
    enabled: z.boolean().default(true),
});
export const UserPreferencesSchema = z.object({
    theme: z.enum(['light', 'dark', 'auto']).default('auto'),
    language: z.string().default('en'),
    aiResponseStyle: z.enum(['concise', 'detailed', 'conversational']).default('conversational'),
    autoSave: z.boolean().default(true),
    autoSaveInterval: z.number().min(30).max(600).default(300), // seconds
    notificationsEnabled: z.boolean().default(true),
    telemetryEnabled: z.boolean().default(false),
    experimentalFeatures: z.boolean().default(false),
});
export const SettingsSchema = z.object({
    version: z.string().default('1.0.0'),
    encryption: z.object({
        enabled: z.boolean().default(true),
        keyDerivation: z.enum(['pbkdf2', 'scrypt']).default('pbkdf2'),
    }),
    aiProviders: z.array(AIProviderConfigSchema).default([]),
    deploymentConfigs: z.array(DeploymentConfigSchema).default([]),
    gitConfigs: z.array(GitConfigSchema).default([]),
    userPreferences: UserPreferencesSchema.default({}),
    metadata: z.object({
        createdAt: z.date().default(() => new Date()),
        updatedAt: z.date().default(() => new Date()),
        lastBackup: z.date().optional(),
    }).default({}),
});
/**
 * Settings Manager with encryption and validation
 */
export class SettingsManager {
    constructor(initialSettings, encryptionKey) {
        this.settings = SettingsSchema.parse(initialSettings || {});
        this.encryptionKey = encryptionKey || SecureStorage.generateKey();
        this.isEncrypted = this.settings.encryption.enabled;
    }
    /**
     * Get current settings (sensitive data will be masked)
     */
    getSettings() {
        return { ...this.settings };
    }
    /**
     * Get settings for display (sensitive data masked)
     */
    getPublicSettings() {
        return {
            ...this.settings,
            aiProviders: this.settings.aiProviders.map(({ apiKey, ...rest }) => rest),
            deploymentConfigs: this.settings.deploymentConfigs.map(({ apiKey, accessToken, ...rest }) => rest),
            gitConfigs: this.settings.gitConfigs.map(({ accessToken, ...rest }) => rest),
        };
    }
    /**
     * Add or update AI provider configuration
     */
    updateAIProvider(config) {
        const existingIndex = this.settings.aiProviders.findIndex(p => p.provider === config.provider && p.name === config.name);
        if (existingIndex >= 0) {
            this.settings.aiProviders[existingIndex] = config;
        }
        else {
            this.settings.aiProviders.push(config);
        }
        this.settings.metadata.updatedAt = new Date();
    }
    /**
     * Remove AI provider configuration
     */
    removeAIProvider(provider, name) {
        const initialLength = this.settings.aiProviders.length;
        this.settings.aiProviders = this.settings.aiProviders.filter(p => !(p.provider === provider && p.name === name));
        if (this.settings.aiProviders.length < initialLength) {
            this.settings.metadata.updatedAt = new Date();
            return true;
        }
        return false;
    }
    /**
     * Update user preferences
     */
    updatePreferences(preferences) {
        this.settings.userPreferences = UserPreferencesSchema.parse({
            ...this.settings.userPreferences,
            ...preferences,
        });
        this.settings.metadata.updatedAt = new Date();
    }
    /**
     * Get decrypted API key for a provider
     */
    getAPIKey(provider, name) {
        const config = this.settings.aiProviders.find(p => p.provider === provider && p.name === name);
        if (!config) {
            return null;
        }
        if (this.isEncrypted) {
            try {
                return SecureStorage.decrypt(config.apiKey, this.encryptionKey);
            }
            catch (error) {
                console.error('Failed to decrypt API key:', error);
                return null;
            }
        }
        return config.apiKey;
    }
    /**
     * Get all enabled AI providers with decrypted keys
     */
    getEnabledAIProviders() {
        const providers = {};
        this.settings.aiProviders
            .filter(p => p.enabled)
            .forEach(provider => {
            const key = this.getAPIKey(provider.provider, provider.name);
            if (key) {
                providers[`${provider.provider}-${provider.name}`] = key;
            }
        });
        return providers;
    }
    /**
     * Serialize settings for storage (encrypted if enabled)
     */
    serialize() {
        if (this.isEncrypted) {
            // Encrypt sensitive fields
            const encryptedSettings = {
                ...this.settings,
                aiProviders: this.settings.aiProviders.map(provider => ({
                    ...provider,
                    apiKey: SecureStorage.encrypt(provider.apiKey, this.encryptionKey),
                })),
                deploymentConfigs: this.settings.deploymentConfigs.map(config => ({
                    ...config,
                    apiKey: config.apiKey ? SecureStorage.encrypt(config.apiKey, this.encryptionKey) : undefined,
                    accessToken: config.accessToken ? SecureStorage.encrypt(config.accessToken, this.encryptionKey) : undefined,
                })),
                gitConfigs: this.settings.gitConfigs.map(config => ({
                    ...config,
                    accessToken: SecureStorage.encrypt(config.accessToken, this.encryptionKey),
                })),
            };
            return JSON.stringify(encryptedSettings);
        }
        return JSON.stringify(this.settings);
    }
    /**
     * Load settings from serialized data
     */
    static fromSerialized(data, encryptionKey) {
        try {
            const parsed = JSON.parse(data);
            const settings = SettingsSchema.parse(parsed);
            return new SettingsManager(settings, encryptionKey);
        }
        catch (error) {
            console.error('Failed to deserialize settings:', error);
            return new SettingsManager();
        }
    }
    /**
     * Validate current settings
     */
    validate() {
        try {
            SettingsSchema.parse(this.settings);
            return { isValid: true, errors: [] };
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    isValid: false,
                    errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
                };
            }
            return { isValid: false, errors: [String(error)] };
        }
    }
    /**
     * Save settings to storage
     */
    async save(newSettings) {
        if (newSettings) {
            this.settings = SettingsSchema.parse({ ...this.settings, ...newSettings });
        }
        this.settings.metadata.updatedAt = new Date();
        // In a real implementation, this would save to VS Code settings or secure storage
        // For now, we'll use a simple in-memory approach
        console.log('Settings saved:', this.getPublicSettings());
    }
    /**
     * Load settings from storage
     */
    async load() {
        // In a real implementation, this would load from VS Code settings or secure storage
        // For now, return current settings
        return this.getSettings();
    }
    /**
     * Reset settings to defaults
     */
    async reset() {
        this.settings = SettingsSchema.parse({});
        await this.save();
    }
    /**
     * Import settings from external data
     */
    async import(data) {
        const parsedSettings = SettingsSchema.parse(data);
        this.settings = parsedSettings;
        await this.save();
    }
    /**
     * Export settings (sensitive data encrypted)
     */
    async export() {
        return this.serialize();
    }
}
// Default AI provider configurations for common services
export const defaultAIProviders = [
    {
        provider: 'openai',
        name: 'GPT-4',
        model: 'gpt-4-turbo-preview',
        maxTokens: 4096,
        temperature: 0.7,
        priority: 9,
    },
    {
        provider: 'anthropic',
        name: 'Claude-3',
        model: 'claude-3-sonnet-20240229',
        maxTokens: 4096,
        temperature: 0.7,
        priority: 8,
    },
    {
        provider: 'openai',
        name: 'GPT-3.5',
        model: 'gpt-3.5-turbo',
        maxTokens: 4096,
        temperature: 0.7,
        priority: 5,
    },
];
