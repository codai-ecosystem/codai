import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { createLogger } from './loggerService';

/**
 * TemplateGenerator class responsible for generating code templates
 * Extracted from BuilderAgent to improve maintainability
 */
export class TemplateGenerator {
	private readonly logger = createLogger('TemplateGenerator');

	constructor() {
		this.logger.debug('TemplateGenerator initialized');
	}

	/**
	 * Generate function code template
	 * @param functionName Name of the function to generate
	 */
	public generateFunctionCode(functionName: string): string {
		return `/**
 * ${this.formatFunctionName(functionName)}
 * @param param1 First parameter description
 * @param param2 Second parameter description
 * @returns Result description
 */
export function ${functionName}(param1: any, param2: any): any {
    // TODO: Add implementation
    return null;
}

/**
 * Unit tests for ${functionName}
 */
describe('${functionName}', () => {
    test('should work correctly', () => {
        // TODO: Add test implementation
        expect(${functionName}(null, null)).toBeNull();
    });
});
`;
	}

	/**
	 * Generate React component template
	 * @param componentName Name of the component to generate
	 */
	public generateComponentCode(componentName: string): string {
		return `import React, { useState, useEffect } from 'react';
import './${componentName}.css';

interface ${componentName}Props {
    title?: string;
    onAction?: () => void;
}

/**
 * ${componentName} component
 */
export const ${componentName}: React.FC<${componentName}Props> = ({ title = 'Default Title', onAction }) => {
    const [isActive, setIsActive] = useState<boolean>(false);

    useEffect(() => {
        // Component mounted
        return () => {
            // Component will unmount
        };
    }, []);

    const handleClick = () => {
        setIsActive(!isActive);
        if (onAction) {
            onAction();
        }
    };    return (
        <div className={\`\${this.kebabCase(componentName)} \${isActive ? 'active' : ''}\`}>
            <h2>{title}</h2>
            <button onClick={handleClick}>
                {isActive ? 'Deactivate' : 'Activate'}
            </button>
        </div>
    );
};

export default ${componentName};
`;
	}

	/**
	 * Generate component CSS template
	 * @param componentName Name of the component to generate CSS for
	 */
	public generateComponentCSS(componentName: string): string {
		const kebabName = this.kebabCase(componentName);
		return `.${kebabName} {
    padding: 1rem;
    margin: 1rem 0;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
    transition: all 0.3s ease;
}

.${kebabName}.active {
    border-color: #4285f4;
    box-shadow: 0 2px 8px rgba(66, 133, 244, 0.3);
}

.${kebabName} h2 {
    margin-top: 0;
    color: #333;
}

.${kebabName} button {
    padding: 0.5rem 1rem;
    background-color: #4285f4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.${kebabName} button:hover {
    background-color: #3367d6;
}
`;
	}

	/**
	 * Generate component style code
	 * @param componentName Name of the component
	 */
	public generateComponentStyleCode(componentName: string): string {
		const kebabName = this.kebabCase(componentName);
		return `.${kebabName} {
    display: flex;
    flex-direction: column;
    margin: 1rem 0;
}

.${kebabName}-title {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
}

.${kebabName}-container {
    padding: 1rem;
    border-radius: 4px;
    background-color: #f5f5f5;
}`;
	}

	/**
	 * Generate component test template
	 * @param componentName Name of the component to generate tests for
	 */
	public generateComponentTest(componentName: string): string {
		return `import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ${componentName} } from './${componentName}';

describe('${componentName} Component', () => {
    test('renders with default title', () => {
        render(<${componentName} />);
        expect(screen.getByText('Default Title')).toBeInTheDocument();
    });

    test('renders with custom title', () => {
        render(<${componentName} title="Custom Title" />);
        expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    test('handles click events', () => {
        const mockOnAction = jest.fn();
        render(<${componentName} onAction={mockOnAction} />);

        fireEvent.click(screen.getByText('Activate'));
        expect(mockOnAction).toHaveBeenCalledTimes(1);
    });
});
`;
	}

	/**
	 * Generate feature hook template
	 * @param featureName Name of the feature to generate
	 */
	public generateFeatureHook(featureName: string): string {
		return `import { useState, useEffect } from 'react';

export interface ${featureName}State {
    isLoading: boolean;
    error: Error | null;
    data: any;
}

export function use${featureName}() {
    const [state, setState] = useState<${featureName}State>({
        isLoading: false,
        error: null,
        data: null
    });

    const load${featureName} = async () => {
        setState(prev => ({ ...prev, isLoading: true }));
        try {
            // TODO: Implement actual data loading
            const data = await fetch('/api/${this.kebabCase(featureName)}')
                .then(res => res.json());

            setState({
                isLoading: false,
                error: null,
                data
            });
        } catch (error) {
            setState({
                isLoading: false,
                error: error instanceof Error ? error : new Error('Unknown error'),
                data: null
            });
        }
    };

    useEffect(() => {
        load${featureName}();
    }, []);

    const refresh = () => {
        load${featureName}();
    };

    return {
        ...state,
        refresh
    };
}
`;
	}

	/**
	 * Generate server code template
	 * @param name Name of the server
	 * @param port Port number
	 */
	public generateServerCode(name: string, port: number = 3000): string {
		return `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || ${port};

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: '${name}-service',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.get('/api', (req, res) => {
    res.json({
        message: 'Welcome to the ${name} API',
        version: '1.0.0',
        endpoints: [
            { path: '/health', method: 'GET', description: 'Health check endpoint' },
            { path: '/api', method: 'GET', description: 'API information' }
        ]
    });
});

// Start server
app.listen(PORT, () => {
    this.logger.info(\`🚀 Server running on port \${PORT}\`);
    this.logger.info(\`📊 Health check: http://localhost:\${PORT}/health\`);
});

export default app;
`;
	}

	/**
	 * Generate feature index code
	 * @param componentName Name of the component/feature
	 */
	public generateFeatureIndexCode(componentName: string): string {
		return `// Index file for ${componentName} feature
export * from './${componentName}';
export * from './${componentName}View';
export * from './hooks';
export * from './types';
`;
	}

	/**
	 * Format function name for documentation
	 * @param name Function name to format
	 */
	private formatFunctionName(name: string): string {
		return name
			.replace(/([A-Z])/g, ' $1')
			.replace(/^./, str => str.toUpperCase())
			.trim();
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
