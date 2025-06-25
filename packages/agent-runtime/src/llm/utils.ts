/**
 * Utilities for LLM service adapters
 */

/**
 * Fetch with Server-Sent Events support
 */
export async function fetchSSE(
	url: string,
	options: RequestInit & {
		onMessage: (data: any) => void;
		onError?: (error: Error) => void;
		signal?: AbortSignal;
	}
): Promise<void> {
	const { onMessage, onError, signal, ...fetchOptions } = options;
	try {
		const response = await fetch(url, {
			...fetchOptions,
			signal: signal || null,
		});

		if (!response.ok) {
			const error = new Error(`HTTP error ${response.status}: ${await response.text()}`);
			if (onError) {
				onError(error);
			}
			throw error;
		}

		const reader = response.body?.getReader();
		if (!reader) {
			throw new Error('Response has no readable body');
		}

		const decoder = new TextDecoder();
		let buffer = '';

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');

				// Process all complete lines
				buffer = lines.pop() || '';

				for (const line of lines) {
					const trimmedLine = line.trim();
					if (!trimmedLine || trimmedLine === '[DONE]') continue;

					try {
						if (trimmedLine.startsWith('data: ')) {
							const data = trimmedLine.slice(6);
							if (data === '[DONE]') continue;

							try {
								const parsedData = JSON.parse(data);
								onMessage(parsedData);
							} catch (err) {
								// If it's not valid JSON, pass the raw data
								onMessage(data);
							}
						} else {
							try {
								const parsedLine = JSON.parse(trimmedLine);
								onMessage(parsedLine);
							} catch (err) {
								// Non-JSON data line, just pass it through if it's not empty
								if (trimmedLine) {
									onMessage(trimmedLine);
								}
							}
						}
					} catch (err) {
						console.warn('Error processing SSE line:', err);
					}
				}
			}
		} finally {
			reader.releaseLock();
		}
	} catch (error) {
		if (onError) {
			onError(error as Error);
		}
		throw error;
	}
}
