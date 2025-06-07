/**
 * Constants for the AIDE Control Panel
 * Centralized location for all application constants
 */

// HTTP Status Codes
export const HTTP_STATUS = {
	OK: 200,
	CREATED: 201,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	INTERNAL_SERVER_ERROR: 500,
} as const;

// Agent Types
export const AGENT_TYPES = {
	PLANNER: 'planner',
	BUILDER: 'builder',
	DESIGNER: 'designer',
	TESTER: 'tester',
	DEPLOYER: 'deployer',
	GENERAL: 'general',
} as const;

// Task Priorities
export const TASK_PRIORITIES = {
	LOW: 'low',
	MEDIUM: 'medium',
	HIGH: 'high',
	CRITICAL: 'critical',
} as const;

// Task Statuses
export const TASK_STATUSES = {
	PENDING: 'pending',
	IN_PROGRESS: 'in_progress',
	COMPLETED: 'completed',
	FAILED: 'failed',
	CANCELLED: 'cancelled',
} as const;

// User Roles
export const USER_ROLES = {
	USER: 'user',
	ADMIN: 'admin',
	SUPERADMIN: 'superadmin',
} as const;

// Plan Intervals
export const PLAN_INTERVALS = {
	MONTH: 'month',
	YEAR: 'year',
} as const;

// Project Types
export const PROJECT_TYPES = {
	WEB_APP: 'web-app',
	API: 'api',
	STATIC_SITE: 'static-site',
	FUNCTION: 'function',
	OTHER: 'other',
} as const;

// Deployment Providers
export const DEPLOYMENT_PROVIDERS = {
	CLOUD_RUN: 'cloud-run',
	VERCEL: 'vercel',
	NETLIFY: 'netlify',
	FIREBASE: 'firebase',
} as const;

// Default Values
export const DEFAULTS = {
	TASK_PRIORITY: TASK_PRIORITIES.MEDIUM,
	AGENT_TYPE: AGENT_TYPES.PLANNER,
	PAGE_SIZE: 20,
	MAX_RETRIES: 3,
	TIMEOUT_MS: 30000,
} as const;

// Validation Constants
export const VALIDATION = {
	MIN_PASSWORD_LENGTH: 8,
	MAX_DESCRIPTION_LENGTH: 1000,
	MAX_TITLE_LENGTH: 100,
	MIN_TITLE_LENGTH: 3,
} as const;

export type AgentType = typeof AGENT_TYPES[keyof typeof AGENT_TYPES];
export type TaskPriority = typeof TASK_PRIORITIES[keyof typeof TASK_PRIORITIES];
export type TaskStatus = typeof TASK_STATUSES[keyof typeof TASK_STATUSES];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type PlanInterval = typeof PLAN_INTERVALS[keyof typeof PLAN_INTERVALS];
export type ProjectType = typeof PROJECT_TYPES[keyof typeof PROJECT_TYPES];
export type DeploymentProvider = typeof DEPLOYMENT_PROVIDERS[keyof typeof DEPLOYMENT_PROVIDERS];
