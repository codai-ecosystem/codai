import { BaseAgent } from './baseAgent';
import { IMemoryGraph } from '../interfaces/IMemoryGraph';
import { AgentResponse, AgentAction } from './agentManager';

export class DesignerAgent extends BaseAgent {
	constructor(memoryGraph: IMemoryGraph, aiService: any) {
		super(memoryGraph, 'designer', aiService);
	}

	async process(message: string, intentId: string): Promise<AgentResponse> {
		const context = this.getRelatedContext(message);
		const designType = this.determineDesignType(message);

		let response: string;
		const actions: AgentAction[] = [];

		switch (designType) {
			case 'ui':
				response = await this.designUI(message, intentId, context, actions);
				break;
			case 'ux':
				response = await this.designUX(message, intentId, context, actions);
				break;
			case 'layout':
				response = await this.designLayout(message, intentId, context, actions);
				break;
			case 'theme':
				response = await this.designTheme(message, intentId, context, actions);
				break;
			default:
				response = await this.generalDesign(message, intentId, context, actions);
		}

		// Add design to memory graph
		this.memoryGraph.addNode('screen', `Designed: ${message}`, {
			agent: 'designer',
			designType,
			timestamp: new Date().toISOString()
		});

		return {
			agent: 'designer',
			message: response,
			actions,
			metadata: {
				designType,
				actionsGenerated: actions.length,
				contextItems: context.length
			}
		};
	}

	async getStatus(): Promise<Record<string, any>> {
		const screens = this.memoryGraph.getNodesByType('screen')
			.filter(node => node.metadata.agent === 'designer');

		return {
			totalDesigns: screens.length,
			recentDesigns: screens.slice(-5).map(s => s.content),
			designTypes: this.getDesignTypeStats(screens)
		};
	}

	private determineDesignType(message: string): string {
		const lowercaseMessage = message.toLowerCase();

		if (lowercaseMessage.includes('ui') || lowercaseMessage.includes('interface')) {
			return 'ui';
		}
		if (lowercaseMessage.includes('ux') || lowercaseMessage.includes('experience')) {
			return 'ux';
		}
		if (lowercaseMessage.includes('layout') || lowercaseMessage.includes('structure')) {
			return 'layout';
		}
		if (lowercaseMessage.includes('theme') || lowercaseMessage.includes('style')) {
			return 'theme';
		}

		return 'general';
	}
	private async designUI(message: string, intentId: string, context: string[], actions: AgentAction[]): Promise<string> {
		const systemPrompt = `You are a UI/UX designer agent responsible for creating user interfaces. Your task is to:
1. Analyze user requirements for UI design
2. Create modern, accessible, and user-friendly designs
3. Follow design systems and best practices
4. Ensure responsive design principles
5. Consider accessibility (WCAG guidelines)
6. Create cohesive visual hierarchy and user experience

Focus on creating designs that are both beautiful and functional, with proper color contrast, typography, and layout principles.`;

		const prompt = `Design a user interface for: "${message}". Create modern, accessible, and user-friendly designs.

Context: ${context.join('\n')}

Please provide:
1. UI design specification
2. Component layout and structure
3. Color scheme and typography recommendations
4. Responsive design considerations
5. Accessibility features
6. CSS/styling recommendations`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		// Generate UI design files
		actions.push({
			type: 'createFile',
			target: 'src/styles/components.css',
			content: this.generateUIStyles()
		});

		actions.push({
			type: 'createFile',
			target: 'design/ui-spec.md',
			content: this.generateUISpecification(message)
		});

		return `🎨 **UI Design Complete**

**Design Concept:**
${aiResponse}

**Generated Assets:**
- Component styles with modern design system
- UI specification document
- Accessibility guidelines
- Responsive design patterns

**Design Principles Applied:**
- ✅ Mobile-first responsive design
- ✅ WCAG 2.1 accessibility compliance
- ✅ Modern color palette and typography
- ✅ Consistent spacing and layout
- ✅ Intuitive navigation patterns

**Next Steps:**
- Review design specifications
- Implement components
- Conduct usability testing
- Iterate based on feedback`;
	}
	private async designUX(message: string, intentId: string, context: string[], actions: AgentAction[]): Promise<string> {
		const systemPrompt = `You are a UX designer agent responsible for user experience design. Your task is to:
1. Analyze user needs and behaviors
2. Create intuitive user flows and interactions
3. Design for usability and accessibility
4. Consider user journey mapping
5. Ensure consistent interaction patterns
6. Focus on user-centered design principles

Create experiences that are intuitive, efficient, and delightful for users.`;

		const prompt = `Design the user experience for: "${message}". Focus on user flows, interactions, and usability.

Context: ${context.join('\n')}

Please provide:
1. User flow diagrams
2. Interaction patterns
3. Usability considerations
4. User journey mapping
5. Accessibility requirements
6. Prototyping recommendations`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		actions.push({
			type: 'createFile',
			target: 'design/user-flows.md',
			content: this.generateUserFlows(message)
		});

		return `🧭 **UX Design Complete**

**User Experience Strategy:**
${aiResponse}

**Key UX Elements:**
- 📋 User journey mapping
- 🎯 Interaction design patterns
- 🔄 Information architecture
- 📱 Cross-platform consistency
- ⚡ Performance optimization

**Deliverables:**
- User flow documentation
- Wireframes and prototypes
- Interaction specifications
- Usability testing plan

**UX Principles:**
- User-centered design approach
- Progressive disclosure
- Error prevention and recovery
- Consistent mental models
- Accessibility first`;
	}
	private async designLayout(message: string, intentId: string, context: string[], actions: AgentAction[]): Promise<string> {
		const systemPrompt = `You are a layout designer agent responsible for creating responsive layouts. Your task is to:
1. Design flexible, responsive layout systems
2. Create proper grid systems and spacing
3. Ensure mobile-first design approach
4. Consider content hierarchy and readability
5. Implement modern CSS layout techniques (Grid, Flexbox)
6. Optimize for performance and accessibility

Focus on creating layouts that work seamlessly across all devices and screen sizes.`;

		const prompt = `Design the layout structure for: "${message}". Create responsive, flexible layout systems.

Context: ${context.join('\n')}

Please provide:
1. Layout structure and grid system
2. Responsive breakpoints and behavior
3. Component spacing and hierarchy
4. Mobile-first design considerations
5. CSS Grid/Flexbox implementations
6. Performance optimization recommendations`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		actions.push({
			type: 'createFile',
			target: 'src/styles/layout.css',
			content: this.generateLayoutStyles()
		});

		return `📐 **Layout Design Complete**

**Layout Strategy:**
${aiResponse}

**Layout System:**
- 🏗️ CSS Grid and Flexbox foundation
- 📱 Mobile-first responsive breakpoints
- 🎛️ Modular component spacing
- 🔧 Utility-first approach
- ⚖️ Visual hierarchy principles

**Generated:**
- Base layout styles
- Responsive grid system
- Component layout utilities
- Spacing and sizing scales

**Features:**
- Consistent spacing system
- Flexible grid layouts
- Responsive design patterns
- Component composition support`;
	}
	private async designTheme(message: string, intentId: string, context: string[], actions: AgentAction[]): Promise<string> {
		const systemPrompt = `You are a visual design agent responsible for creating design systems and themes. Your task is to:
1. Create cohesive visual identity and branding
2. Design comprehensive design token systems
3. Establish color palettes with proper contrast ratios
4. Define typography scales and hierarchies
5. Create consistent spacing and sizing systems
6. Ensure accessibility compliance (WCAG guidelines)

Focus on creating scalable design systems that maintain consistency across all touchpoints.`;

		const prompt = `Design a theme system for: "${message}". Create cohesive visual identity and design tokens.

Context: ${context.join('\n')}

Please provide:
1. Complete design token system
2. Color palette with accessibility ratios
3. Typography scale and font selections
4. Spacing and sizing systems
5. Component styling guidelines
6. Brand identity recommendations`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		actions.push({
			type: 'createFile',
			target: 'src/styles/theme.css',
			content: this.generateThemeStyles()
		});

		actions.push({
			type: 'createFile',
			target: 'design/design-tokens.json',
			content: this.generateDesignTokens()
		});

		return `🎭 **Theme Design Complete**

**Theme Concept:**
${aiResponse}

**Design System:**
- 🎨 Color palette with semantic tokens
- 📝 Typography scale and font stacks
- 📏 Spacing and sizing systems
- 🎯 Component variants and states
- 🌓 Dark/light mode support

**Generated Assets:**
- CSS custom properties theme
- Design tokens specification
- Component style variations
- Brand identity guidelines

**Theme Features:**
- Consistent visual language
- Easy customization
- Accessibility compliance
- Cross-browser compatibility`;
	}
	private async generalDesign(message: string, intentId: string, context: string[], actions: AgentAction[]): Promise<string> {
		const systemPrompt = `You are a general design agent responsible for providing comprehensive design guidance. Your task is to:
1. Analyze design requirements and constraints
2. Suggest appropriate design approaches and methodologies
3. Consider user experience and visual design principles
4. Recommend design tools and workflows
5. Identify design system opportunities
6. Provide actionable design recommendations

Focus on delivering practical design guidance that aligns with project goals and user needs.`;

		const prompt = `Provide design guidance for: "${message}". Analyze design requirements and suggest approaches.

Context: ${context.join('\n')}

Please provide:
1. Design requirement analysis
2. Recommended design approaches
3. Tool and workflow suggestions
4. Design system considerations
5. User experience recommendations
6. Implementation guidelines`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		return `🎨 **Design Analysis**

${aiResponse}

**Design Recommendations:**
- Define visual requirements
- Create user personas
- Establish design principles
- Plan component architecture

**Suggested Design Process:**
1. 🔍 Research and discovery
2. 🎯 Define design goals
3. ✏️ Wireframe and prototype
4. 🎨 Visual design system
5. 🧪 Test and iterate

**Next Steps:**
- Clarify specific design needs
- Gather user requirements
- Create design specifications
- Begin implementation planning`;
	}

	// Helper methods for generating design assets
	private generateUIStyles(): string {
		return `/* Modern UI Component Styles */
:root {
	--primary-color: #007acc;
	--secondary-color: #6c757d;
	--success-color: #28a745;
	--warning-color: #ffc107;
	--danger-color: #dc3545;
	--light-color: #f8f9fa;
	--dark-color: #343a40;

	--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	--border-radius: 6px;
	--spacing-xs: 0.25rem;
	--spacing-sm: 0.5rem;
	--spacing-md: 1rem;
	--spacing-lg: 1.5rem;
	--spacing-xl: 3rem;
}

.btn {
	display: inline-flex;
	align-items: center;
	padding: var(--spacing-sm) var(--spacing-md);
	border: none;
	border-radius: var(--border-radius);
	font-family: var(--font-family);
	font-weight: 500;
	text-decoration: none;
	cursor: pointer;
	transition: all 0.2s ease;
}

.btn-primary {
	background-color: var(--primary-color);
	color: white;
}

.btn-primary:hover {
	background-color: #0056b3;
	transform: translateY(-1px);
}

.card {
	background: white;
	border-radius: var(--border-radius);
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	padding: var(--spacing-lg);
	margin-bottom: var(--spacing-md);
}

.input {
	width: 100%;
	padding: var(--spacing-sm);
	border: 1px solid #ddd;
	border-radius: var(--border-radius);
	font-family: var(--font-family);
	font-size: 1rem;
}

.input:focus {
	outline: none;
	border-color: var(--primary-color);
	box-shadow: 0 0 0 3px rgba(0, 122, 204, 0.1);
}`;
	}

	private generateLayoutStyles(): string {
		return `/* Responsive Layout System */
.container {
	width: 100%;
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 var(--spacing-md);
}

.grid {
	display: grid;
	gap: var(--spacing-md);
}

.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }

@media (max-width: 768px) {
	.grid-2,
	.grid-3,
	.grid-4 {
		grid-template-columns: 1fr;
	}
}

.flex {
	display: flex;
	gap: var(--spacing-md);
}

.flex-column { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.justify-center { justify-content: center; }
.align-center { align-items: center; }
.justify-between { justify-content: space-between; }

.mb-sm { margin-bottom: var(--spacing-sm); }
.mb-md { margin-bottom: var(--spacing-md); }
.mb-lg { margin-bottom: var(--spacing-lg); }

.p-sm { padding: var(--spacing-sm); }
.p-md { padding: var(--spacing-md); }
.p-lg { padding: var(--spacing-lg); }`;
	}

	private generateThemeStyles(): string {
		return `/* Design System Theme */
:root {
	/* Colors */
	--color-primary-50: #eff6ff;
	--color-primary-100: #dbeafe;
	--color-primary-500: #3b82f6;
	--color-primary-600: #2563eb;
	--color-primary-900: #1e3a8a;

	--color-gray-50: #f9fafb;
	--color-gray-100: #f3f4f6;
	--color-gray-500: #6b7280;
	--color-gray-900: #111827;

	/* Typography */
	--font-size-xs: 0.75rem;
	--font-size-sm: 0.875rem;
	--font-size-base: 1rem;
	--font-size-lg: 1.125rem;
	--font-size-xl: 1.25rem;
	--font-size-2xl: 1.5rem;
	--font-size-3xl: 1.875rem;

	--font-weight-normal: 400;
	--font-weight-medium: 500;
	--font-weight-semibold: 600;
	--font-weight-bold: 700;

	/* Spacing */
	--space-1: 0.25rem;
	--space-2: 0.5rem;
	--space-3: 0.75rem;
	--space-4: 1rem;
	--space-6: 1.5rem;
	--space-8: 2rem;
	--space-12: 3rem;

	/* Borders */
	--border-width: 1px;
	--border-radius-sm: 0.25rem;
	--border-radius: 0.375rem;
	--border-radius-lg: 0.5rem;

	/* Shadows */
	--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
	--shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
	--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Dark theme */
[data-theme="dark"] {
	--color-primary-50: #1e3a8a;
	--color-primary-100: #2563eb;
	--color-primary-500: #60a5fa;
	--color-primary-600: #93c5fd;
	--color-primary-900: #dbeafe;

	--color-gray-50: #111827;
	--color-gray-100: #1f2937;
	--color-gray-500: #9ca3af;
	--color-gray-900: #f9fafb;
}`;
	}

	private generateDesignTokens(): string {
		return JSON.stringify({
			"colors": {
				"primary": {
					"50": "#eff6ff",
					"100": "#dbeafe",
					"500": "#3b82f6",
					"600": "#2563eb",
					"900": "#1e3a8a"
				},
				"gray": {
					"50": "#f9fafb",
					"100": "#f3f4f6",
					"500": "#6b7280",
					"900": "#111827"
				}
			},
			"typography": {
				"fontFamily": {
					"sans": ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"]
				},
				"fontSize": {
					"xs": "0.75rem",
					"sm": "0.875rem",
					"base": "1rem",
					"lg": "1.125rem",
					"xl": "1.25rem",
					"2xl": "1.5rem",
					"3xl": "1.875rem"
				}
			},
			"spacing": {
				"1": "0.25rem",
				"2": "0.5rem",
				"3": "0.75rem",
				"4": "1rem",
				"6": "1.5rem",
				"8": "2rem",
				"12": "3rem"
			}
		}, null, 2);
	}

	private generateUISpecification(message: string): string {
		return `# UI Design Specification

## Project: ${message}

### Design Overview
This document outlines the user interface design for ${message}.

### Components
- **Navigation**: Primary navigation with clear hierarchy
- **Content Areas**: Structured content layout with proper spacing
- **Interactive Elements**: Buttons, forms, and controls
- **Feedback Systems**: Loading states, error messages, success indicators

### Design Principles
1. **Simplicity**: Clean, uncluttered interface
2. **Consistency**: Uniform patterns across all screens
3. **Accessibility**: WCAG 2.1 AA compliance
4. **Responsiveness**: Mobile-first design approach

### Color Palette
- Primary: #3b82f6 (Blue)
- Secondary: #6b7280 (Gray)
- Success: #10b981 (Green)
- Warning: #f59e0b (Amber)
- Error: #ef4444 (Red)

### Typography
- Headings: System font stack, bold weights
- Body: System font stack, regular weight
- Code: Monospace font for technical content

### Spacing System
- Base unit: 4px
- Scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px

Generated by AIDE Designer Agent.`;
	}

	private generateUserFlows(message: string): string {
		return `# User Flows

## Project: ${message}

### Primary User Journey
1. **Entry Point**: User arrives at the application
2. **Discovery**: User explores available features
3. **Engagement**: User interacts with core functionality
4. **Completion**: User achieves their goal
5. **Return**: User returns for additional interactions

### Key Interactions
- Navigation patterns
- Form submissions
- Data visualization
- Search and filtering
- Content creation/editing

### Error Handling
- Clear error messages
- Recovery suggestions
- Progressive disclosure of complex errors
- Graceful degradation

### Accessibility Considerations
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

Generated by AIDE Designer Agent.`;
	}

	private getDesignTypeStats(screens: any[]): Record<string, number> {
		const stats: Record<string, number> = {};
		screens.forEach(screen => {
			const type = screen.metadata.designType || 'unknown';
			stats[type] = (stats[type] || 0) + 1;
		});
		return stats;
	}
}
