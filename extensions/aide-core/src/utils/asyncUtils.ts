/**
 * Utility functions for async operation handling with timeouts
 */

export class TimeoutError extends Error {
	constructor(operation: string, timeoutMs: number) {
		super(`Operation '${operation}' timed out after ${timeoutMs}ms`);
		this.name = 'TimeoutError';
	}
}

/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @param operation Description of the operation for error messages
 * @returns Promise that resolves or rejects with timeout
 */
export function withTimeout<T>(
	promise: Promise<T>,
	timeoutMs: number,
	operation: string = 'operation'
): Promise<T> {
	return new Promise((resolve, reject) => {
		const timeoutId = setTimeout(() => {
			reject(new TimeoutError(operation, timeoutMs));
		}, timeoutMs);

		promise
			.then(result => {
				clearTimeout(timeoutId);
				resolve(result);
			})
			.catch(error => {
				clearTimeout(timeoutId);
				reject(error);
			});
	});
}

/**
 * Wraps an async function with timeout handling
 * @param fn The async function to wrap
 * @param timeoutMs Default timeout in milliseconds
 * @param operation Description of the operation
 * @returns Wrapped function with timeout
 */
export function withTimeoutWrapper<T extends any[], R>(
	fn: (...args: T) => Promise<R>,
	timeoutMs: number,
	operation: string
): (...args: T) => Promise<R> {
	return (...args: T) => withTimeout(fn(...args), timeoutMs, operation);
}

/**
 * Retry an operation with exponential backoff
 * @param operation The operation to retry
 * @param maxRetries Maximum number of retries
 * @param baseDelayMs Base delay between retries in milliseconds
 * @param operationName Description for logging
 * @returns Promise that resolves on success or rejects after all retries
 */
export async function withRetry<T>(
	operation: () => Promise<T>,
	maxRetries: number = 3,
	baseDelayMs: number = 1000,
	operationName: string = 'operation'
): Promise<T> {
	let lastError: Error;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error as Error;

			if (attempt === maxRetries) {
				throw new Error(
					`Operation '${operationName}' failed after ${maxRetries + 1} attempts. Last error: ${lastError.message}`
				);
			}

			// Exponential backoff
			const delay = baseDelayMs * Math.pow(2, attempt);
			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}

	throw lastError!;
}

/**
 * Debounce function to limit how often a function can be called
 * @param func Function to debounce
 * @param waitMs Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends any[]>(
	func: (...args: T) => void,
	waitMs: number
): (...args: T) => void {
	let timeoutId: NodeJS.Timeout;

	return (...args: T) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func(...args), waitMs);
	};
}

/**
 * Throttle function to limit how often a function can be called
 * @param func Function to throttle
 * @param limitMs Minimum time between calls in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends any[]>(
	func: (...args: T) => void,
	limitMs: number
): (...args: T) => void {
	let inThrottle: boolean;

	return (...args: T) => {
		if (!inThrottle) {
			func(...args);
			inThrottle = true;
			setTimeout(() => inThrottle = false, limitMs);
		}
	};
}

/**
 * Race multiple promises with timeout
 * @param promises Array of promises to race
 * @param timeoutMs Timeout in milliseconds
 * @param operation Description for error messages
 * @returns Promise that resolves with first successful result or rejects on timeout
 */
export function raceWithTimeout<T>(
	promises: Promise<T>[],
	timeoutMs: number,
	operation: string = 'race operation'
): Promise<T> {
	const timeoutPromise = new Promise<never>((_, reject) => {
		setTimeout(() => reject(new TimeoutError(operation, timeoutMs)), timeoutMs);
	});

	return Promise.race([...promises, timeoutPromise]);
}
