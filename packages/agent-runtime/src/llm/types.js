/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { z } from 'zod';
// Zod schema for LLM configuration validation
export const LLMModelConfigSchema = z.object({
    provider: z.enum(['openai', 'anthropic', 'google', 'ollama', 'local', 'custom']),
    model: z.string(),
    apiKey: z.string().optional(),
    baseUrl: z.string().url().optional(),
    maxTokens: z.number().positive().optional(),
    temperature: z.number().min(0).max(1).optional(),
    parameters: z.record(z.any()).optional(),
});
