# AIDE Coding Examples

This document provides examples of code that follows the AIDE coding standards. These examples serve as a reference for developers working on the project.

## TypeScript Examples

### Type Definitions

```typescript
/**
 * Represents a user in the system
 */
interface User {
	id: string;
	name: string;
	email: string;
	isActive: boolean;
	createdAt: Date;
	preferences?: UserPreferences;
}

/**
 * User preference settings
 */
interface UserPreferences {
	theme: Theme;
	notifications: NotificationSettings;
	language: string;
}

/**
 * Available UI themes
 *
 * @enum {string}
 */
enum Theme {
	Light = 'light',
	Dark = 'dark',
	System = 'system',
}

/**
 * Settings for user notifications
 */
type NotificationSettings = {
	email: boolean;
	push: boolean;
	frequency: 'immediate' | 'daily' | 'weekly';
};
```

### Function Definitions

```typescript
/**
 * Retrieves a user by their ID
 *
 * @param userId - The unique identifier of the user
 * @returns The user object if found, or null if not exists
 * @throws {NotFoundError} If the user does not exist
 * @throws {AuthorizationError} If the caller lacks permission
 *
 * @example
 * // Get a user by ID
 * const user = await getUserById('user123');
 */
async function getUserById(userId: string): Promise<User | null> {
	try {
		const userDoc = await db.collection('users').doc(userId).get();

		if (!userDoc.exists) {
			return null;
		}

		return userDoc.data() as User;
	} catch (error) {
		logger.error('Failed to fetch user', { userId, error });
		throw new DatabaseError('Failed to fetch user', { cause: error });
	}
}

/**
 * Creates a new user in the system
 *
 * @param userData - The user data to create
 * @returns The created user object with ID
 * @throws {ValidationError} If the user data is invalid
 * @throws {ConflictError} If a user with the email already exists
 */
async function createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
	// Input validation
	const validation = userSchema.safeParse(userData);
	if (!validation.success) {
		throw new ValidationError('Invalid user data', validation.error);
	}

	// Check for existing user
	const existingUser = await getUserByEmail(userData.email);
	if (existingUser) {
		throw new ConflictError('User with this email already exists');
	}

	// Create the user
	const id = generateUniqueId();
	const createdAt = new Date();
	const user: User = {
		...userData,
		id,
		createdAt,
	};

	await db.collection('users').doc(id).set(user);

	return user;
}
```

### Arrow Functions

```typescript
// Simple arrow function
const double = (x: number): number => x * 2;

// Multi-parameter arrow function
const calculateTotal = (items: Item[], taxRate: number): number => {
	const subtotal = items.reduce((sum, item) => sum + item.price, 0);
	return subtotal * (1 + taxRate);
};

// Generic arrow function
const first = <T>(array: T[]): T | undefined => (array.length > 0 ? array[0] : undefined);
```

## React Examples

### Functional Component

```tsx
/**
 * User profile card component that displays user information
 *
 * @component
 * @example
 * <UserProfileCard user={currentUser} onUpdateClick={handleUpdate} />
 */
interface UserProfileCardProps {
	/** The user to display */
	user: User;
	/** Optional CSS class name */
	className?: string;
	/** Handler for when the update button is clicked */
	onUpdateClick?: (userId: string) => void;
}

function UserProfileCard({ user, className, onUpdateClick }: UserProfileCardProps): JSX.Element {
	const handleClick = (): void => {
		if (onUpdateClick) {
			onUpdateClick(user.id);
		}
	};

	return (
		<div className={`user-profile-card ${className || ''}`}>
			<h3 className="user-profile-name">{user.name}</h3>
			<p className="user-profile-email">{user.email}</p>
			<p className="user-profile-status">Status: {user.isActive ? 'Active' : 'Inactive'}</p>
			<button onClick={handleClick} className="update-button">
				Update Profile
			</button>
		</div>
	);
}
```

### Custom Hook

```tsx
/**
 * Custom hook for managing user authentication state
 *
 * @returns Authentication state and methods
 * @example
 * const { user, isLoading, signIn, signOut } = useAuth();
 */
function useAuth() {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged(
			authUser => {
				if (authUser) {
					// Transform auth user to our user model
					setUser({
						id: authUser.uid,
						name: authUser.displayName || 'Anonymous',
						email: authUser.email || '',
						isActive: true,
						createdAt: new Date(authUser.metadata.creationTime || Date.now()),
					});
				} else {
					setUser(null);
				}
				setIsLoading(false);
			},
			err => {
				setError(err);
				setIsLoading(false);
			}
		);

		return () => unsubscribe();
	}, []);

	const signIn = async (email: string, password: string): Promise<User> => {
		setIsLoading(true);
		try {
			const credential = await auth.signInWithEmailAndPassword(email, password);
			if (!credential.user) {
				throw new Error('Failed to sign in');
			}

			const user: User = {
				id: credential.user.uid,
				name: credential.user.displayName || 'Anonymous',
				email: credential.user.email || '',
				isActive: true,
				createdAt: new Date(credential.user.metadata.creationTime || Date.now()),
			};

			return user;
		} catch (error) {
			setError(error as Error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	const signOut = async (): Promise<void> => {
		try {
			await auth.signOut();
		} catch (error) {
			setError(error as Error);
			throw error;
		}
	};

	return {
		user,
		isLoading,
		error,
		signIn,
		signOut,
	};
}
```

## API Client Example

```typescript
/**
 * Client for interacting with the users API
 */
class UserApiClient {
	/**
	 * Creates a new instance of the UserApiClient
	 *
	 * @param baseUrl - The base URL for the API
	 * @param apiKey - Optional API key for authentication
	 */
	constructor(
		private readonly baseUrl: string,
		private readonly apiKey?: string
	) {}

	/**
	 * Retrieves a user by their ID
	 *
	 * @param userId - The user ID to retrieve
	 * @returns The user data
	 * @throws {ApiError} If the API returns an error
	 */
	async getUser(userId: string): Promise<User> {
		try {
			const response = await fetch(`${this.baseUrl}/users/${userId}`, {
				headers: this.getHeaders(),
			});

			if (!response.ok) {
				throw await this.handleErrorResponse(response);
			}

			return await response.json();
		} catch (error) {
			// Re-throw ApiError instances
			if (error instanceof ApiError) {
				throw error;
			}

			// Wrap other errors
			throw new ApiError(500, 'client_error', 'Failed to fetch user', { cause: error });
		}
	}

	/**
	 * Creates a new user
	 *
	 * @param userData - The user data to create
	 * @returns The created user
	 * @throws {ApiError} If the API returns an error
	 */
	async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
		try {
			const response = await fetch(`${this.baseUrl}/users`, {
				method: 'POST',
				headers: this.getHeaders(),
				body: JSON.stringify(userData),
			});

			if (!response.ok) {
				throw await this.handleErrorResponse(response);
			}

			return await response.json();
		} catch (error) {
			if (error instanceof ApiError) {
				throw error;
			}

			throw new ApiError(500, 'client_error', 'Failed to create user', { cause: error });
		}
	}

	/**
	 * Gets the HTTP headers for API requests
	 *
	 * @private
	 * @returns Headers object with appropriate authentication
	 */
	private getHeaders(): HeadersInit {
		const headers: HeadersInit = {
			'Content-Type': 'application/json',
		};

		if (this.apiKey) {
			headers['Authorization'] = `Bearer ${this.apiKey}`;
		}

		return headers;
	}

	/**
	 * Handles error responses from the API
	 *
	 * @private
	 * @param response - The error response
	 * @returns A properly formatted ApiError
	 */
	private async handleErrorResponse(response: Response): Promise<ApiError> {
		try {
			const errorData = await response.json();

			return new ApiError(
				response.status,
				errorData.code || 'unknown_error',
				errorData.message || 'An unknown error occurred',
				errorData.details
			);
		} catch (error) {
			return new ApiError(
				response.status,
				'parse_error',
				`Request failed with status: ${response.status} ${response.statusText}`
			);
		}
	}
}

/**
 * Represents an error returned by the API
 */
class ApiError extends Error {
	/**
	 * Creates a new API error
	 *
	 * @param statusCode - HTTP status code
	 * @param code - Error code
	 * @param message - Error message
	 * @param details - Additional error details
	 */
	constructor(
		public readonly statusCode: number,
		public readonly code: string,
		message: string,
		public readonly details?: any
	) {
		super(message);
		this.name = 'ApiError';
	}
}
```

## Error Handling Examples

```typescript
/**
 * Processes a file with proper error handling
 *
 * @param filePath - Path to the file
 * @returns The processed content
 */
async function processFile(filePath: string): Promise<string> {
	try {
		// Check if file exists
		const fileExists = await fs.existsSync(filePath);
		if (!fileExists) {
			throw new FileNotFoundError(`File not found: ${filePath}`);
		}

		// Read file
		const content = await fs.readFile(filePath, 'utf-8');

		// Process content
		return processContent(content);
	} catch (error) {
		// Categorize and enhance errors
		if (error instanceof FileNotFoundError) {
			// Re-throw specific errors
			throw error;
		} else if (error instanceof Error) {
			// Wrap known error types
			throw new ProcessingError(`Failed to process file ${filePath}`, { cause: error });
		} else {
			// Handle unknown errors
			throw new ProcessingError('An unknown error occurred during file processing');
		}
	}
}

// Custom error types
class FileNotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'FileNotFoundError';
	}
}

class ProcessingError extends Error {
	constructor(
		message: string,
		public readonly options?: { cause: unknown }
	) {
		super(message, options);
		this.name = 'ProcessingError';
	}
}
```

These examples demonstrate the coding standards and best practices to be followed in the AIDE project. When writing new code or refactoring existing code, refer to these examples for guidance on structure, naming, typing, and documentation.
