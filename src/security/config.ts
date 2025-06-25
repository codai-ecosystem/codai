/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Security configuration for AIDE
 * Handles input sanitization, rate limiting, and secrets management
 */

export interface SecurityConfig {
	rateLimit: {
		enabled: boolean;
		requestsPerMinute: number;
		burstLimit: number;
	};
	inputSanitization: {
		enabled: boolean;
		maxInputLength: number;
		allowedFileTypes: string[];
	};
	secrets: {
		encryptionKey: string;
		apiKeysEncrypted: boolean;
	};
}

export const defaultSecurityConfig: SecurityConfig = {
	rateLimit: {
		enabled: true,
		requestsPerMinute: 60,
		burstLimit: 10,
	},
	inputSanitization: {
		enabled: true,
		maxInputLength: 10000,
		allowedFileTypes: ['.ts', '.js', '.json', '.md', '.txt', '.yml', '.yaml'],
	},
	secrets: {
		encryptionKey: process.env.AIDE_ENCRYPTION_KEY || 'default-dev-key-change-in-prod',
		apiKeysEncrypted: process.env.NODE_ENV === 'production',
	},
};

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
	if (input.length > defaultSecurityConfig.inputSanitization.maxInputLength) {
		throw new Error('Input too long');
	}

	// Remove potentially dangerous characters
	return input
		.replace(/<script[^>]*>.*?<\/script>/gi, '')
		.replace(/javascript:/gi, '')
		.replace(/on\w+\s*=/gi, '');
}

/**
 * Validate file type is allowed
 */
export function validateFileType(filename: string): boolean {
	const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
	return defaultSecurityConfig.inputSanitization.allowedFileTypes.includes(ext);
}
