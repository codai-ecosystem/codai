import { BaseAgentImpl } from './BaseAgentImpl';
/**
 * Designer Agent
 * Responsible for creating user interfaces and design systems
 */
export class DesignerAgent extends BaseAgentImpl {
	constructor(config, memoryGraph) {
		super(config, memoryGraph);
	}
	canExecuteTask(task) {
		const designTasks = [
			'ui',
			'design',
			'wireframe',
			'prototype',
			'style',
			'component',
			'interface',
			'visual',
			'layout',
			'ux',
			'user experience',
			'development',
		];
		// Check if task has a type property and it matches our capabilities
		if (task.type) {
			const taskType = task.type.toLowerCase();
			if (designTasks.some(keyword => taskType.includes(keyword))) {
				return true;
			}
		}
		const titleLower = task.title.toLowerCase();
		const descriptionLower = task.description.toLowerCase();
		return (
			designTasks.some(
				taskType => titleLower.includes(taskType) || descriptionLower.includes(taskType)
			) || task.agentId === 'designer'
		);
	}
	async executeTask(task) {
		const startTime = Date.now();
		await this.onTaskStarted(task);
		try {
			const requirements = task.inputs.requirements || task.inputs.feature;
			const brandGuidelines = task.inputs.brand || {};
			let result;
			if (task.title.toLowerCase().includes('system')) {
				result = await this.createDesignSystem(requirements, brandGuidelines);
			} else if (task.title.toLowerCase().includes('wireframe')) {
				result = await this.createWireframes(requirements);
			} else if (task.title.toLowerCase().includes('prototype')) {
				result = await this.createPrototype(requirements);
			} else {
				result = await this.designUserInterface(requirements, brandGuidelines);
			}
			const taskResult = {
				success: true,
				outputs: result,
				duration: Date.now() - startTime,
				memoryChanges: result.memoryChanges || [],
			};
			await this.onTaskCompleted(task, taskResult);
			return taskResult;
		} catch (error) {
			const taskResult = {
				success: false,
				error: error instanceof Error ? error.message : String(error),
				duration: Date.now() - startTime,
			};
			await this.onTaskFailed(task, error instanceof Error ? error : new Error(String(error)));
			return taskResult;
		}
	}
	/**
	 * Create a comprehensive design system
	 */
	async createDesignSystem(requirements, brandGuidelines) {
		await this.sendMessage({
			type: 'notification',
			content: 'Creating design system...',
		});
		// Generate color palette
		const colorPalette = this.generateColorPalette(brandGuidelines);
		// Generate typography system
		const typography = this.generateTypographySystem(brandGuidelines);
		// Generate spacing system
		const spacing = this.generateSpacingSystem();
		// Generate component tokens
		const componentTokens = this.generateComponentTokens();
		// Generate Tailwind config
		const tailwindConfig = this.generateTailwindDesignSystem(colorPalette, typography, spacing);
		return {
			design_system: {
				colors: colorPalette,
				typography: typography,
				spacing: spacing,
				components: componentTokens,
				tailwind_config: tailwindConfig,
			},
			css_variables: this.generateCSSVariables(colorPalette, typography, spacing),
			documentation: this.generateDesignSystemDocumentation(colorPalette, typography, spacing),
		};
	}
	/**
	 * Create wireframes for user interfaces
	 */
	async createWireframes(requirements) {
		await this.sendMessage({
			type: 'notification',
			content: 'Creating wireframes...',
		});
		const screens = requirements.screens || [requirements];
		const wireframes = [];
		for (const screen of screens) {
			const wireframe = {
				name: screen.name,
				layout: this.generateWireframeLayout(screen),
				components: this.identifyComponents(screen),
				navigation: this.planNavigation(screen),
				interactions: this.planInteractions(screen),
			};
			wireframes.push(wireframe);
		}
		return {
			wireframes: wireframes,
			user_flows: this.generateUserFlows(screens),
			information_architecture: this.generateInformationArchitecture(screens),
		};
	}
	/**
	 * Create interactive prototypes
	 */
	async createPrototype(requirements) {
		await this.sendMessage({
			type: 'notification',
			content: 'Creating interactive prototype...',
		});
		// Generate prototype structure
		const prototype = {
			screens: this.generatePrototypeScreens(requirements),
			interactions: this.generatePrototypeInteractions(requirements),
			animations: this.generatePrototypeAnimations(requirements),
			state_management: this.generatePrototypeStateManagement(requirements),
		};
		return {
			prototype: prototype,
			prototype_code: this.generatePrototypeCode(prototype),
			demo_data: this.generateDemoData(requirements),
		};
	}
	/**
	 * Design user interface
	 */
	async designUserInterface(requirements, brandGuidelines) {
		await this.sendMessage({
			type: 'notification',
			content: `Designing UI for ${requirements.name || 'feature'}...`,
		});
		// Analyze requirements and create design specifications
		const designSpecs = await this.analyzeUIRequirements(requirements);
		// Generate visual design
		const visualDesign = this.generateVisualDesign(designSpecs, brandGuidelines);
		// Generate component designs
		const componentDesigns = this.generateComponentDesigns(designSpecs, visualDesign);
		// Generate responsive design
		const responsiveDesign = this.generateResponsiveDesign(componentDesigns);
		// Update memory graph
		const memoryChanges = await this.updateMemoryWithDesign(requirements, visualDesign);
		return {
			design_specifications: designSpecs,
			visual_design: visualDesign,
			component_designs: componentDesigns,
			responsive_design: responsiveDesign,
			style_guide: this.generateStyleGuide(visualDesign),
			css_classes: this.generateCSSClasses(componentDesigns),
			memoryChanges,
		};
	}
	// Helper methods for design system
	generateColorPalette(brandGuidelines) {
		const primaryColor = brandGuidelines.primaryColor || '#3B82F6';
		const secondaryColor = brandGuidelines.secondaryColor || '#10B981';
		return {
			primary: {
				50: this.lightenColor(primaryColor, 0.95),
				100: this.lightenColor(primaryColor, 0.9),
				200: this.lightenColor(primaryColor, 0.8),
				300: this.lightenColor(primaryColor, 0.6),
				400: this.lightenColor(primaryColor, 0.4),
				500: primaryColor,
				600: this.darkenColor(primaryColor, 0.1),
				700: this.darkenColor(primaryColor, 0.2),
				800: this.darkenColor(primaryColor, 0.3),
				900: this.darkenColor(primaryColor, 0.4),
				950: this.darkenColor(primaryColor, 0.5),
			},
			secondary: {
				50: this.lightenColor(secondaryColor, 0.95),
				500: secondaryColor,
				900: this.darkenColor(secondaryColor, 0.4),
			},
			gray: {
				50: '#F9FAFB',
				100: '#F3F4F6',
				200: '#E5E7EB',
				300: '#D1D5DB',
				400: '#9CA3AF',
				500: '#6B7280',
				600: '#4B5563',
				700: '#374151',
				800: '#1F2937',
				900: '#111827',
				950: '#030712',
			},
			semantic: {
				success: '#10B981',
				warning: '#F59E0B',
				error: '#EF4444',
				info: '#3B82F6',
			},
		};
	}
	generateTypographySystem(brandGuidelines) {
		const primaryFont = brandGuidelines.primaryFont || 'Inter';
		const secondaryFont = brandGuidelines.secondaryFont || 'system-ui';
		return {
			fonts: {
				primary: primaryFont,
				secondary: secondaryFont,
				mono: 'Monaco, Consolas, monospace',
			},
			sizes: {
				xs: '0.75rem',
				sm: '0.875rem',
				base: '1rem',
				lg: '1.125rem',
				xl: '1.25rem',
				'2xl': '1.5rem',
				'3xl': '1.875rem',
				'4xl': '2.25rem',
				'5xl': '3rem',
				'6xl': '3.75rem',
			},
			weights: {
				light: '300',
				normal: '400',
				medium: '500',
				semibold: '600',
				bold: '700',
			},
			lineHeights: {
				tight: '1.25',
				normal: '1.5',
				relaxed: '1.75',
			},
		};
	}
	generateSpacingSystem() {
		return {
			0: '0',
			1: '0.25rem',
			2: '0.5rem',
			3: '0.75rem',
			4: '1rem',
			5: '1.25rem',
			6: '1.5rem',
			8: '2rem',
			10: '2.5rem',
			12: '3rem',
			16: '4rem',
			20: '5rem',
			24: '6rem',
			32: '8rem',
		};
	}
	generateComponentTokens() {
		return {
			button: {
				padding: {
					sm: '0.5rem 1rem',
					md: '0.75rem 1.5rem',
					lg: '1rem 2rem',
				},
				borderRadius: '0.5rem',
				fontWeight: '500',
			},
			input: {
				padding: '0.75rem 1rem',
				borderRadius: '0.5rem',
				borderWidth: '1px',
			},
			card: {
				padding: '1.5rem',
				borderRadius: '0.75rem',
				shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
			},
		};
	}
	generateTailwindDesignSystem(colors, typography, spacing) {
		return {
			colors: colors,
			fontFamily: typography.fonts,
			fontSize: typography.sizes,
			fontWeight: typography.weights,
			lineHeight: typography.lineHeights,
			spacing: spacing,
		};
	}
	generateCSSVariables(colors, typography, spacing) {
		let css = ':root {\n';
		// Color variables
		for (const [colorName, colorValues] of Object.entries(colors)) {
			for (const [shade, value] of Object.entries(colorValues)) {
				css += `  --color-${colorName}-${shade}: ${value};\n`;
			}
		}
		// Typography variables
		for (const [sizeName, sizeValue] of Object.entries(typography.sizes)) {
			css += `  --font-size-${sizeName}: ${sizeValue};\n`;
		}
		css += '}\n';
		return css;
	}
	// Helper methods for wireframes
	generateWireframeLayout(screen) {
		return {
			type: 'flex',
			direction: 'column',
			sections: [
				{ type: 'header', height: '4rem' },
				{ type: 'main', flex: 1 },
				{ type: 'footer', height: '3rem' },
			],
		};
	}
	identifyComponents(screen) {
		const components = ['Header', 'Navigation', 'Content', 'Footer'];
		if (screen.type === 'form') {
			components.push('Form', 'Input', 'Button');
		}
		if (screen.type === 'list') {
			components.push('List', 'ListItem', 'Pagination');
		}
		return components;
	}
	planNavigation(screen) {
		return {
			primary: ['Home', 'Products', 'About', 'Contact'],
			secondary: [],
			breadcrumbs: true,
		};
	}
	planInteractions(screen) {
		return [
			{ trigger: 'click', action: 'navigate', target: 'button' },
			{ trigger: 'hover', action: 'highlight', target: 'link' },
		];
	}
	// Helper methods for prototypes
	generatePrototypeScreens(requirements) {
		return [
			{
				name: 'Home',
				route: '/',
				components: ['Header', 'Hero', 'Features', 'Footer'],
			},
		];
	}
	generatePrototypeInteractions(requirements) {
		return [
			{
				id: 'button-click',
				trigger: 'onClick',
				action: 'navigate',
				params: { to: '/next-page' },
			},
		];
	}
	generatePrototypeAnimations(requirements) {
		return [
			{
				name: 'fadeIn',
				duration: '300ms',
				easing: 'ease-out',
			},
		];
	}
	generatePrototypeStateManagement(requirements) {
		return {
			global: ['user', 'theme'],
			local: ['form', 'modal'],
		};
	}
	generatePrototypeCode(prototype) {
		return `
			// Prototype code generated by AIDE Designer Agent
			import React from 'react';

			export const Prototype = () => {
				return (
					<div className="prototype">
						{/* Prototype implementation */}
					</div>
				);
			};
		`;
	}
	generateDemoData(requirements) {
		return {
			users: [
				{ id: 1, name: 'John Doe', email: 'john@example.com' },
				{ id: 2, name: 'Jane Smith', email: 'jane@example.com' },
			],
			products: [
				{ id: 1, name: 'Product A', price: 99.99 },
				{ id: 2, name: 'Product B', price: 149.99 },
			],
		};
	}
	// Helper methods for UI design
	async analyzeUIRequirements(requirements) {
		return {
			purpose: requirements.description || 'User interface',
			user_goals: requirements.user_goals || ['Complete task efficiently'],
			content_types: requirements.content_types || ['text', 'images'],
			interactions: requirements.interactions || ['click', 'scroll'],
			constraints: requirements.constraints || {},
		};
	}
	generateVisualDesign(specs, brandGuidelines) {
		return {
			layout: 'grid',
			spacing: 'comfortable',
			hierarchy: 'clear',
			contrast: 'high',
			accessibility: 'wcag-aa',
		};
	}
	generateComponentDesigns(specs, visualDesign) {
		return [
			{
				name: 'PrimaryButton',
				styles: 'bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600',
				variants: ['primary', 'secondary', 'outline'],
			},
		];
	}
	generateResponsiveDesign(componentDesigns) {
		return {
			breakpoints: {
				sm: '640px',
				md: '768px',
				lg: '1024px',
				xl: '1280px',
			},
			responsive_rules: [
				'Stack vertically on mobile',
				'Use larger touch targets on mobile',
				'Simplify navigation on small screens',
			],
		};
	}
	async updateMemoryWithDesign(requirements, visualDesign) {
		// Update memory graph with design information
		return [];
	}
	generateStyleGuide(visualDesign) {
		return `
			# Style Guide

			## Visual Design Principles
			- Layout: ${visualDesign.layout}
			- Spacing: ${visualDesign.spacing}
			- Hierarchy: ${visualDesign.hierarchy}
			- Contrast: ${visualDesign.contrast}
			- Accessibility: ${visualDesign.accessibility}
		`;
	}
	generateCSSClasses(componentDesigns) {
		const classes = {};
		for (const component of componentDesigns) {
			classes[component.name] = component.styles;
		}
		return classes;
	}
	generateDesignSystemDocumentation(colors, typography, spacing) {
		return `
			# Design System Documentation

			## Colors
			${JSON.stringify(colors, null, 2)}

			## Typography
			${JSON.stringify(typography, null, 2)}

			## Spacing
			${JSON.stringify(spacing, null, 2)}
		`;
	}
	generateUserFlows(screens) {
		return [
			{
				name: 'Main User Flow',
				steps: screens.map(screen => ({
					screen: screen.name,
					action: 'Navigate',
				})),
			},
		];
	}
	generateInformationArchitecture(screens) {
		return {
			sitemap: screens.map(screen => ({
				name: screen.name,
				children: [],
			})),
			navigation: 'hierarchical',
		};
	}
	// Color utility methods
	lightenColor(color, amount) {
		// Simple color lightening (would use proper color library in production)
		return color;
	}
	darkenColor(color, amount) {
		// Simple color darkening (would use proper color library in production)
		return color;
	}
}
