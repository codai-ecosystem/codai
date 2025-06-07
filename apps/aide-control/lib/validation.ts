/**
 * Input validation schemas using Zod
 * Ensures type safety and data validation across the application
 */
import { z } from 'zod';
import {
	AGENT_TYPES,
	TASK_PRIORITIES,
	PROJECT_TYPES,
	VALIDATION
} from './constants';

// User-related schemas
export const CreateUserSchema = z.object({
	email: z.string().email('Invalid email address'),
	displayName: z.string().min(2, 'Display name must be at least 2 characters').optional(),
	role: z.enum(['user', 'admin', 'superadmin']).default('user'),
});

export const UpdateUserSchema = CreateUserSchema.partial();

// Task-related schemas
export const CreateTaskSchema = z.object({
	title: z.string()
		.min(VALIDATION.MIN_TITLE_LENGTH, `Title must be at least ${VALIDATION.MIN_TITLE_LENGTH} characters`)
		.max(VALIDATION.MAX_TITLE_LENGTH, `Title must be no more than ${VALIDATION.MAX_TITLE_LENGTH} characters`),
	description: z.string()
		.min(1, 'Description is required')
		.max(VALIDATION.MAX_DESCRIPTION_LENGTH, `Description must be no more than ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`),
	type: z.enum(Object.values(AGENT_TYPES) as [string, ...string[]]).default(AGENT_TYPES.GENERAL),
	agentId: z.string().min(1, 'Agent ID is required').optional(),
	projectId: z.string().optional(),
	priority: z.enum(Object.values(TASK_PRIORITIES) as [string, ...string[]]).default(TASK_PRIORITIES.MEDIUM),
	inputs: z.record(z.any()).optional(),
	context: z.record(z.any()).optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

// Project-related schemas
export const CreateProjectSchema = z.object({
	name: z.string()
		.min(VALIDATION.MIN_TITLE_LENGTH, `Project name must be at least ${VALIDATION.MIN_TITLE_LENGTH} characters`)
		.max(VALIDATION.MAX_TITLE_LENGTH, `Project name must be no more than ${VALIDATION.MAX_TITLE_LENGTH} characters`),
	description: z.string()
		.max(VALIDATION.MAX_DESCRIPTION_LENGTH, `Description must be no more than ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`)
		.optional(),
	type: z.enum(Object.values(PROJECT_TYPES) as [string, ...string[]]).default(PROJECT_TYPES.OTHER),
	repository: z.object({
		url: z.string().url('Invalid repository URL'),
		branch: z.string().min(1, 'Branch is required').default('main'),
		path: z.string().default('/'),
	}),
	settings: z.object({
		buildCommand: z.string().default('npm run build'),
		outputDirectory: z.string().default('dist'),
		environmentVariables: z.record(z.string()).default({}),
		customDomain: z.string().optional(),
		autoSave: z.boolean().default(true),
		backupFrequency: z.enum(['hourly', 'daily', 'weekly']).default('daily'),
		visibility: z.enum(['private', 'team', 'public']).default('private'),
	}).optional(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

// API Key schemas
export const CreateApiKeySchema = z.object({
	name: z.string()
		.min(VALIDATION.MIN_TITLE_LENGTH, `API key name must be at least ${VALIDATION.MIN_TITLE_LENGTH} characters`)
		.max(VALIDATION.MAX_TITLE_LENGTH, `API key name must be no more than ${VALIDATION.MAX_TITLE_LENGTH} characters`),
	description: z.string()
		.max(VALIDATION.MAX_DESCRIPTION_LENGTH, `Description must be no more than ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`)
		.optional(),
	scopes: z.array(z.string()).default(['read']),
	expiresAt: z.string().datetime().optional(),
});

// Message schemas
export const SendMessageSchema = z.object({
	content: z.string().min(1, 'Message content is required'),
	type: z.enum(['text', 'command', 'code']).default('text'),
	metadata: z.record(z.any()).optional(),
});

// Pagination schema
export const PaginationSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	sortBy: z.string().optional(),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Common schemas
export const IdParamSchema = z.object({
	id: z.string().min(1, 'ID is required'),
});

export const UidParamSchema = z.object({
	uid: z.string().min(1, 'User ID is required'),
});

// Type exports
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type IdParam = z.infer<typeof IdParamSchema>;
export type UidParam = z.infer<typeof UidParamSchema>;

/**
 * Validate request body against a schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated data
 * @throws {Error} If validation fails
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
	const result = schema.safeParse(data);
	if (!result.success) {
		const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
		throw new Error(`Validation failed: ${errors}`);
	}
	return result.data;
}

/**
 * Validate URL search params against a schema
 * @param schema - Zod schema to validate against
 * @param searchParams - URLSearchParams to validate
 * @returns Validated data
 */
export function validateSearchParams<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): T {
	const data = Object.fromEntries(searchParams.entries());
	return validateInput(schema, data);
}
