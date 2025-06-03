import { BaseAgent } from './baseAgent';
import { IMemoryGraph } from '../interfaces/IMemoryGraph';
import { AgentResponse, AgentAction } from './agentManager';

export class PlannerAgent extends BaseAgent {
	constructor(memoryGraph: IMemoryGraph, aiService: any) {
		super(memoryGraph, 'planner', aiService);
	}

	async process(message: string, intentId: string): Promise<AgentResponse> {
		// Get related context from memory
		const context = this.getRelatedContext(message);

		// Analyze the request to determine planning scope
		const planningType = this.determinePlanningType(message);

		let response: string;
		const actions: AgentAction[] = [];

		switch (planningType) {
			case 'feature':
				response = await this.planFeature(message, intentId, context);
				break;
			case 'architecture':
				response = await this.planArchitecture(message, intentId, context);
				break;
			case 'project':
				response = await this.planProject(message, intentId, context);
				break;
			default:
				response = await this.generalPlanning(message, intentId, context);
		}

		// Add planning decisions to memory graph
		this.addDecision(`Planned: ${message}`, response, intentId);

		return {
			agent: 'planner',
			message: response,
			actions,
			metadata: {
				planningType,
				contextItems: context.length
			}
		};
	}

	async getStatus(): Promise<Record<string, any>> {
		const features = this.memoryGraph.getNodesByType('feature');
		const decisions = this.memoryGraph.getNodesByType('decision');

		return {
			plannedFeatures: features.length,
			planningDecisions: decisions.length,
			status: 'active',
			capabilities: [
				'Feature Planning',
				'Architecture Planning',
				'Project Planning',
				'Resource Estimation'
			]
		};
	}

	private determinePlanningType(message: string): string {
		const lowerMessage = message.toLowerCase();

		if (lowerMessage.includes('project') || lowerMessage.includes('app') || lowerMessage.includes('system')) {
			return 'project';
		}
		if (lowerMessage.includes('architecture') || lowerMessage.includes('design') || lowerMessage.includes('structure')) {
			return 'architecture';
		}
		if (lowerMessage.includes('feature') || lowerMessage.includes('function') || lowerMessage.includes('component')) {
			return 'feature';
		}

		return 'general';
	}
	private async planFeature(message: string, intentId: string, context: string[]): Promise<string> {
		const systemPrompt = `You are AIDE's PlannerAgent, an expert software architect and project planner. Your role is to:

1. Analyze feature requests and break them down into actionable implementation steps
2. Identify technical requirements, dependencies, and potential challenges
3. Suggest appropriate technologies, patterns, and best practices
4. Provide realistic effort estimates and timelines
5. Consider testing, security, and maintainability aspects

Provide structured, actionable plans that other agents can follow to implement features successfully.`;

		const prompt = `Plan the implementation of this feature: "${message}"

Please provide a comprehensive feature plan including:
- Feature scope and requirements
- Technical approach and architecture decisions
- Implementation steps and dependencies
- Testing strategy
- Potential challenges and mitigation strategies
- Estimated effort and timeline

Format your response as a structured plan with clear sections.`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		return `🎯 **Feature Planning Complete**

${aiResponse}

**Memory Updated:** Added feature plan to memory graph for future reference.`;
	}
	private async planArchitecture(message: string, intentId: string, context: string[]): Promise<string> {
		const systemPrompt = `You are AIDE's PlannerAgent specializing in system architecture design. Your expertise includes:

1. Designing scalable, maintainable system architectures
2. Selecting appropriate technology stacks and design patterns
3. Planning component relationships and data flow
4. Considering security, performance, and scalability requirements
5. Creating clear architectural documentation and diagrams

Provide comprehensive architectural plans that serve as blueprints for development teams.`;

		const prompt = `Design the system architecture for: "${message}"

Please provide a detailed architectural plan including:
- High-level system overview and component architecture
- Technology stack recommendations with justifications
- Data flow and component interaction patterns
- Security and scalability considerations
- Deployment and infrastructure requirements
- API design and integration points

Structure your response clearly with architectural decisions and their rationale.`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		return `🏗️ **Architecture Planning Complete**

${aiResponse}

**Memory Updated:** Added architectural decisions to memory graph for reference during implementation.`;
	} private async planProject(message: string, intentId: string, context: string[]): Promise<string> {
		const systemPrompt = `You are AIDE's PlannerAgent specializing in comprehensive project planning. Your expertise includes:

1. Creating complete project roadmaps from concept to deployment
2. Technology stack selection and justification
3. Project structure and organization best practices
4. Development workflow and tooling recommendations
5. Timeline estimation and milestone planning
6. Risk assessment and mitigation strategies

Create detailed project plans that guide teams from initial setup through successful deployment.`;

		const prompt = `Create a comprehensive project plan for: "${message}"

Please provide a complete project plan including:
- Project overview and objectives
- Technology stack recommendations with justifications
- Recommended project structure and file organization
- Development workflow and tooling setup
- Implementation roadmap with phases and milestones
- Testing and quality assurance strategy
- Deployment and DevOps considerations
- Timeline estimates and resource requirements

Structure your response as a comprehensive project blueprint.`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		// Extract project type from message or context
		const projectType = this.extractProjectType(message);

		return `🚀 **Comprehensive Project Plan - ${projectType}**

${aiResponse}

**Next Steps:**
1. Project Setup & Configuration
2. UI/UX Design & Wireframes
3. Core Feature Development
4. API Integration & Backend
5. Testing & Quality Assurance
6. Deployment & Launch

**Memory Updated:** Added complete project plan to memory graph for ongoing reference.`;
	}

	private extractProjectType(message: string): string {
		if (message.includes('web-app') || message.includes('web application')) return 'Web Application';
		if (message.includes('mobile-app') || message.includes('mobile')) return 'Mobile Application';
		if (message.includes('api') || message.includes('REST')) return 'API Service';
		if (message.includes('desktop-app') || message.includes('desktop')) return 'Desktop Application';
		return 'Custom Project';
	}

	private getTechnologyStack(projectType: string): string {
		switch (projectType) {
			case 'Web Application':
				return `- **Frontend:** React/Next.js with TypeScript
- **Styling:** Tailwind CSS or Styled Components
- **Build Tool:** Vite or Next.js built-in
- **Testing:** Jest + React Testing Library
- **Package Manager:** npm or yarn`;

			case 'Mobile Application':
				return `- **Framework:** React Native or Expo
- **Language:** TypeScript
- **Navigation:** React Navigation
- **State Management:** Redux Toolkit or Zustand
- **Testing:** Jest + React Native Testing Library`;

			case 'API Service':
				return `- **Runtime:** Node.js
- **Framework:** Express.js or Fastify
- **Language:** TypeScript
- **Database:** PostgreSQL or MongoDB
- **ORM:** Prisma or TypeORM
- **Testing:** Jest + Supertest`;

			case 'Desktop Application':
				return `- **Framework:** Electron or Tauri
- **Frontend:** React/Vue with TypeScript
- **Build Tool:** Webpack or Vite
- **Testing:** Jest + Electron Testing
- **Packaging:** electron-builder`;

			default:
				return `- Technology stack to be determined based on requirements
- Will analyze project needs and recommend optimal technologies
- Considering modern, maintainable, and scalable solutions`;
		}
	}

	private getProjectStructure(projectType: string): string {
		switch (projectType) {
			case 'Web Application':
				return `\`\`\`
project-name/
├── src/
│   ├── components/
│   ├── pages/
│   ├── styles/
│   ├── utils/
│   └── types/
├── public/
├── tests/
├── package.json
└── README.md
\`\`\``;

			case 'Mobile Application':
				return `\`\`\`
project-name/
├── src/
│   ├── components/
│   ├── screens/
│   ├── navigation/
│   ├── services/
│   └── types/
├── assets/
├── __tests__/
├── package.json
└── README.md
\`\`\``;

			case 'API Service':
				return `\`\`\`
project-name/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── types/
├── tests/
├── database/
├── package.json
└── README.md
\`\`\``;

			case 'Desktop Application':
				return `\`\`\`
project-name/
├── src/
│   ├── main/          (Electron main process)
│   ├── renderer/      (UI components)
│   ├── preload/       (Preload scripts)
│   └── shared/        (Shared utilities)
├── assets/
├── build/
├── package.json
└── README.md
\`\`\``;

			default:
				return `Project structure will be designed based on specific requirements and chosen technologies.`;
		}
	}
	private async generalPlanning(message: string, intentId: string, context: string[]): Promise<string> {
		const systemPrompt = `You are AIDE's PlannerAgent providing general planning guidance. Your role is to:

1. Analyze requirements and clarify project scope
2. Suggest appropriate planning approaches and methodologies
3. Identify key considerations and potential challenges
4. Recommend next steps for more detailed planning
5. Help users organize their thoughts and requirements

Provide helpful, actionable planning guidance for any development-related request.`;

		const prompt = `Provide planning guidance for: "${message}"

Please analyze this request and provide:
- Initial assessment of the request scope and complexity
- Key questions that should be clarified
- Recommended planning approach or methodology
- Important considerations and potential challenges
- Suggested next steps for moving forward

Help organize this into a clear, actionable plan.`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		return `🤔 **Planning Analysis**

${aiResponse}

**Memory Updated:** Added planning analysis to memory graph for future reference.`;
	}
}
