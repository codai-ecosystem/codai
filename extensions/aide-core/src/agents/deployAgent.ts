import { BaseAgent } from './baseAgent';
import { IMemoryGraph } from '../interfaces/IMemoryGraph';
import { AgentResponse, AgentAction } from './agentManager';

export class DeployAgent extends BaseAgent {
	constructor(memoryGraph: IMemoryGraph, aiService: any) {
		super(memoryGraph, 'deploy', aiService);
	}

	async process(message: string, intentId: string): Promise<AgentResponse> {
		const context = this.getRelatedContext(message);
		const deployType = this.determineDeployType(message);

		let response: string;
		const actions: AgentAction[] = [];

		switch (deployType) {
			case 'web':
				response = await this.deployWeb(message, intentId, context, actions);
				break;
			case 'mobile':
				response = await this.deployMobile(message, intentId, context, actions);
				break;
			case 'desktop':
				response = await this.deployDesktop(message, intentId, context, actions);
				break;
			case 'docker':
				response = await this.deployDocker(message, intentId, context, actions);
				break;
			case 'cloud':
				response = await this.deployCloud(message, intentId, context, actions);
				break;
			default:
				response = await this.analyzeDeploymentRequirements(message, intentId, context, actions);
		}

		return {
			agent: 'deploy',
			message: response,
			actions,
			metadata: {
				deployType,
				actionsGenerated: actions.length,
				contextItems: context.length,
			},
		};
	}

	async getStatus(): Promise<Record<string, any>> {
		return {
			activeDeployments: 0,
			lastDeployment: null,
			deploymentHistory: [],
			platforms: {
				web: { status: 'not_deployed', url: null },
				mobile: { status: 'not_deployed', builds: [] },
				desktop: { status: 'not_deployed', packages: [] },
				cloud: { status: 'not_deployed', services: [] },
			},
		};
	}

	private determineDeployType(message: string): string {
		const lowercaseMessage = message.toLowerCase();

		if (
			lowercaseMessage.includes('web') ||
			lowercaseMessage.includes('website') ||
			lowercaseMessage.includes('vercel') ||
			lowercaseMessage.includes('netlify')
		) {
			return 'web';
		}
		if (
			lowercaseMessage.includes('mobile') ||
			lowercaseMessage.includes('app store') ||
			lowercaseMessage.includes('play store')
		) {
			return 'mobile';
		}
		if (
			lowercaseMessage.includes('desktop') ||
			lowercaseMessage.includes('electron') ||
			lowercaseMessage.includes('tauri')
		) {
			return 'desktop';
		}
		if (lowercaseMessage.includes('docker') || lowercaseMessage.includes('container')) {
			return 'docker';
		}
		if (
			lowercaseMessage.includes('cloud') ||
			lowercaseMessage.includes('aws') ||
			lowercaseMessage.includes('azure') ||
			lowercaseMessage.includes('gcp')
		) {
			return 'cloud';
		}

		return 'general';
	}
	private async deployWeb(
		message: string,
		intentId: string,
		context: string[],
		actions: AgentAction[]
	): Promise<string> {
		const systemPrompt = `You are a deployment agent responsible for web application deployment. Your task is to:
1. Set up static hosting and CDN configurations
2. Configure CI/CD pipelines for automated deployments
3. Optimize build processes for production
4. Implement proper caching strategies
5. Ensure security best practices in deployment
6. Set up monitoring and logging

Focus on creating reliable, scalable, and secure deployment configurations.`;

		const prompt = `Deploy web application: "${message}". Set up static hosting and CI/CD pipeline.

Context: ${context.join('\n')}

Please provide:
1. Deployment configuration for static hosting platforms
2. CI/CD pipeline setup and automation
3. Build optimization strategies
4. CDN and caching configuration
5. Security headers and SSL setup
6. Monitoring and analytics integration`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		// Generate deployment configuration
		actions.push({
			type: 'createFile',
			target: 'vercel.json',
			content: this.generateVercelConfig(),
		});

		actions.push({
			type: 'createFile',
			target: '.github/workflows/deploy.yml',
			content: this.generateGitHubActionsWorkflow(),
		});

		actions.push({
			type: 'createFile',
			target: 'deploy.sh',
			content: this.generateDeployScript(),
		});

		return `🌐 **Web Deployment Ready**

**Deployment Strategy:**
${aiResponse}

**Generated Configuration:**
- \`vercel.json\` - Vercel deployment config
- \`.github/workflows/deploy.yml\` - CI/CD pipeline
- \`deploy.sh\` - Manual deployment script

**Supported Platforms:**
- ✅ Vercel (Recommended for Next.js)
- ✅ Netlify (Static sites)
- ✅ Firebase Hosting
- ✅ GitHub Pages
- ✅ Custom server deployment

**Deployment Features:**
- Automatic builds on git push
- Preview deployments for PRs
- Custom domain support
- SSL certificates
- CDN distribution
- Environment variable management

**Next Steps:**
1. Connect repository to hosting platform
2. Configure environment variables
3. Set up custom domain (optional)
4. Monitor deployment status

**Commands:**
- Build: \`npm run build\`
- Deploy: \`./deploy.sh\`
- Preview: \`npm run preview\``;
	}
	private async deployMobile(
		message: string,
		intentId: string,
		context: string[],
		actions: AgentAction[]
	): Promise<string> {
		const systemPrompt = `You are a deployment agent responsible for mobile application deployment. Your task is to:
1. Set up app store deployment and distribution pipelines
2. Configure code signing and certificates
3. Manage app store metadata and assets
4. Implement over-the-air updates
5. Set up crash reporting and analytics
6. Handle different build variants and environments

Focus on streamlining the mobile app release process while maintaining security and compliance.`;

		const prompt = `Deploy mobile application: "${message}". Set up app store deployment and distribution.

Context: ${context.join('\n')}

Please provide:
1. App store deployment configuration
2. Code signing and certificate setup
3. Automated build and release pipelines
4. App metadata and asset management
5. Testing and distribution strategies
6. Monitoring and crash reporting setup`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		actions.push({
			type: 'createFile',
			target: 'eas.json',
			content: this.generateEASConfig(),
		});

		actions.push({
			type: 'createFile',
			target: 'app.json',
			content: this.generateAppConfig(),
		});

		return `📱 **Mobile Deployment Setup**

**Mobile Strategy:**
${aiResponse}

**Platform Support:**
- 🍎 iOS App Store
- 🤖 Google Play Store
- 📦 Internal distribution
- 🔧 TestFlight (iOS beta)
- 🧪 Internal testing (Android)

**Generated Configuration:**
- \`eas.json\` - Expo Application Services config
- \`app.json\` - App metadata and configuration
- Build profiles for development, preview, and production

**Build Types:**
- **Development**: Internal testing and debugging
- **Preview**: Stakeholder review and feedback
- **Production**: App store submission

**Deployment Process:**
1. Configure app metadata and assets
2. Set up developer accounts (Apple/Google)
3. Generate app signing certificates
4. Build and upload to stores
5. Submit for review

**Commands:**
- Build preview: \`eas build --profile preview\`
- Build production: \`eas build --profile production\`
- Submit to stores: \`eas submit\`

**Requirements:**
- Apple Developer account ($99/year)
- Google Play Developer account ($25 one-time)
- App icons and screenshots
- App store descriptions`;
	}
	private async deployDesktop(
		message: string,
		intentId: string,
		context: string[],
		actions: AgentAction[]
	): Promise<string> {
		const systemPrompt = `You are a deployment agent responsible for desktop application deployment. Your task is to:
1. Set up cross-platform desktop distribution
2. Configure code signing for Windows, macOS, and Linux
3. Create installer packages for different platforms
4. Implement auto-update mechanisms
5. Set up crash reporting and telemetry
6. Handle platform-specific requirements and optimizations

Focus on creating professional desktop applications with proper distribution and update mechanisms.`;

		const prompt = `Deploy desktop application: "${message}". Set up cross-platform desktop distribution.

Context: ${context.join('\n')}

Please provide:
1. Cross-platform build configuration
2. Code signing setup for all platforms
3. Installer and package creation
4. Auto-update implementation
5. Distribution channel setup
6. Platform-specific optimizations`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		actions.push({
			type: 'createFile',
			target: 'tauri.conf.json',
			content: this.generateTauriConfig(),
		});

		actions.push({
			type: 'createFile',
			target: 'src-tauri/Cargo.toml',
			content: this.generateCargoToml(),
		});

		return `🖥️ **Desktop Deployment Setup**

**Desktop Strategy:**
${aiResponse}

**Platform Support:**
- 🪟 Windows (MSI, EXE)
- 🍎 macOS (DMG, PKG)
- 🐧 Linux (AppImage, DEB, RPM)

**Generated Configuration:**
- \`tauri.conf.json\` - Tauri configuration
- \`src-tauri/Cargo.toml\` - Rust dependencies
- Cross-platform build settings

**Distribution Methods:**
- Direct download from website
- Package managers (Homebrew, Chocolatey, Snap)
- Microsoft Store / Mac App Store
- GitHub Releases
- Auto-updater integration

**Build Features:**
- Native performance with Rust backend
- Small bundle size compared to Electron
- System tray integration
- File system access
- Native notifications
- Auto-updater support

**Commands:**
- Dev mode: \`tauri dev\`
- Build: \`tauri build\`
- Bundle: \`tauri bundle\`

**Security:**
- Code signing for trust verification
- Sandboxed execution
- Permission-based API access
- CSP (Content Security Policy)`;
	}
	private async deployDocker(
		message: string,
		intentId: string,
		context: string[],
		actions: AgentAction[]
	): Promise<string> {
		const systemPrompt = `You are a deployment agent responsible for containerized deployment with Docker. Your task is to:
1. Create optimized Docker configurations
2. Set up multi-stage builds for production
3. Implement container orchestration with Docker Compose
4. Configure security best practices for containers
5. Set up container registries and CI/CD pipelines
6. Optimize for performance and resource usage

Focus on creating secure, efficient, and scalable containerized deployments.`;

		const prompt = `Deploy with Docker: "${message}". Set up containerized deployment.

Context: ${context.join('\n')}

Please provide:
1. Optimized Dockerfile with multi-stage builds
2. Docker Compose configuration for orchestration
3. Container security and best practices
4. Registry and CI/CD pipeline setup
5. Performance optimization strategies
6. Monitoring and logging configuration`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		actions.push({
			type: 'createFile',
			target: 'Dockerfile',
			content: this.generateDockerfile(),
		});

		actions.push({
			type: 'createFile',
			target: 'docker-compose.yml',
			content: this.generateDockerCompose(),
		});

		actions.push({
			type: 'createFile',
			target: '.dockerignore',
			content: this.generateDockerIgnore(),
		});

		return `🐳 **Docker Deployment Ready**

**Container Strategy:**
${aiResponse}

**Generated Files:**
- \`Dockerfile\` - Container build instructions
- \`docker-compose.yml\` - Multi-service orchestration
- \`.dockerignore\` - Build context optimization

**Container Features:**
- Multi-stage build optimization
- Layer caching for faster builds
- Security best practices
- Health checks
- Environment configuration
- Volume mounting for data persistence

**Deployment Options:**
- Local development with Docker Compose
- Container registries (Docker Hub, ECR, GCR)
- Kubernetes orchestration
- Docker Swarm clustering
- Cloud container services

**Commands:**
- Build: \`docker build -t myapp .\`
- Run: \`docker run -p 3000:3000 myapp\`
- Compose: \`docker-compose up\`
- Push: \`docker push myapp:latest\`

**Production Considerations:**
- Resource limits and requests
- Horizontal scaling
- Load balancing
- Service discovery
- Logging and monitoring
- Backup and recovery`;
	}
	private async deployCloud(
		message: string,
		intentId: string,
		context: string[],
		actions: AgentAction[]
	): Promise<string> {
		const systemPrompt = `You are a deployment agent responsible for cloud infrastructure deployment. Your task is to:
1. Design scalable cloud architecture
2. Set up Infrastructure as Code (IaC) with Terraform/CloudFormation
3. Configure auto-scaling and load balancing
4. Implement security best practices and compliance
5. Set up monitoring, logging, and alerting
6. Optimize for cost and performance

Focus on creating robust, secure, and cost-effective cloud deployments that can scale with demand.`;

		const prompt = `Deploy to cloud: "${message}". Set up scalable cloud infrastructure.

Context: ${context.join('\n')}

Please provide:
1. Cloud architecture design and Infrastructure as Code
2. Auto-scaling and load balancing configuration
3. Security groups, IAM, and compliance setup
4. Monitoring, logging, and alerting systems
5. Cost optimization strategies
6. Disaster recovery and backup plans`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		actions.push({
			type: 'createFile',
			target: 'terraform/main.tf',
			content: this.generateTerraformConfig(),
		});

		actions.push({
			type: 'createFile',
			target: 'k8s/deployment.yaml',
			content: this.generateKubernetesDeployment(),
		});

		return `☁️ **Cloud Deployment Infrastructure**

**Cloud Strategy:**
${aiResponse}

**Cloud Platforms:**
- ☁️ AWS (EC2, ECS, Lambda, EKS)
- 🔵 Azure (App Service, AKS, Functions)
- 🟡 GCP (Cloud Run, GKE, Cloud Functions)
- 🟣 DigitalOcean (Droplets, Kubernetes)

**Generated Infrastructure:**
- \`terraform/\` - Infrastructure as Code
- \`k8s/\` - Kubernetes manifests
- CI/CD pipeline configurations
- Monitoring and logging setup

**Architecture Components:**
- Load balancers for high availability
- Auto-scaling groups
- Database clusters
- CDN for static assets
- Monitoring and alerting
- Backup and disaster recovery

**Deployment Strategies:**
- Blue-green deployments
- Canary releases
- Rolling updates
- Feature flags
- A/B testing support

**Security Features:**
- VPC/Virtual network isolation
- SSL/TLS termination
- WAF (Web Application Firewall)
- DDoS protection
- Identity and access management
- Secret management

**Monitoring & Observability:**
- Application metrics
- Infrastructure monitoring
- Log aggregation
- Error tracking
- Performance monitoring
- Uptime monitoring`;
	}
	private async analyzeDeploymentRequirements(
		message: string,
		intentId: string,
		context: string[],
		actions: AgentAction[]
	): Promise<string> {
		const systemPrompt = `You are a deployment analysis agent responsible for analyzing deployment requirements. Your task is to:
1. Analyze project requirements and constraints
2. Suggest optimal deployment strategies
3. Consider scalability, security, and cost factors
4. Evaluate different platform options
5. Identify potential deployment challenges
6. Recommend best practices for the specific use case

Focus on providing actionable deployment recommendations based on project requirements.`;

		const prompt = `Analyze deployment requirements for: "${message}". Suggest optimal deployment strategy.

Context: ${context.join('\n')}

Please provide:
1. Deployment strategy analysis
2. Platform recommendations
3. Scalability considerations
4. Security requirements
5. Cost optimization suggestions
6. Implementation roadmap`;

		const aiResponse = await this.generateAIResponse(prompt, context, systemPrompt);

		return `🔍 **Deployment Analysis**

${aiResponse}

**Deployment Strategy Recommendations:**

**For Web Applications:**
- Static sites → Vercel, Netlify, GitHub Pages
- SSR/Dynamic → Vercel, Railway, Render
- Full-stack → AWS, Google Cloud, Azure

**For Mobile Applications:**
- React Native → Expo EAS
- Flutter → Firebase App Distribution
- Native → Xcode Cloud, App Center

**For Desktop Applications:**
- Electron → GitHub Releases, Auto-updater
- Tauri → Cross-platform packages
- Native → Platform-specific stores

**For Backend Services:**
- Containers → Docker, Kubernetes
- Serverless → AWS Lambda, Vercel Functions
- Traditional → VPS, Cloud instances

**Factors to Consider:**
1. **Scale Requirements**
   - Expected traffic/users
   - Geographic distribution
   - Performance requirements

2. **Budget Constraints**
   - Development costs
   - Operational expenses
   - Scaling costs

3. **Technical Requirements**
   - Platform compatibility
   - Integration needs
   - Security requirements

4. **Team Expertise**
   - DevOps knowledge
   - Platform familiarity
   - Maintenance capacity

**Next Steps:**
1. Define specific deployment targets
2. Choose appropriate platforms
3. Set up CI/CD pipelines
4. Configure monitoring and alerts
5. Plan scaling and maintenance`;
	}

	// Helper methods for generating deployment configurations
	private generateVercelConfig(): string {
		return JSON.stringify(
			{
				version: 2,
				builds: [
					{
						src: 'package.json',
						use: '@vercel/node',
					},
				],
				routes: [
					{
						src: '/(.*)',
						dest: '/',
					},
				],
				env: {
					NODE_ENV: 'production',
				},
				build: {
					env: {
						NODE_ENV: 'production',
					},
				},
			},
			null,
			2
		);
	}

	private generateGitHubActionsWorkflow(): string {
		return `name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build project
        run: npm run build

      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.ORG_ID }}
          vercel-project-id: \${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'`;
	}

	private generateDeployScript(): string {
		return `#!/bin/bash

# Deploy script for AIDE project
set -e

echo "🚀 Starting deployment..."

# Check if required tools are installed
command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed. Aborting." >&2; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run tests
echo "🧪 Running tests..."
npm test

# Build project
echo "🔨 Building project..."
npm run build

# Deploy based on platform
if [ "$1" = "vercel" ]; then
    echo "🌐 Deploying to Vercel..."
    npx vercel --prod
elif [ "$1" = "netlify" ]; then
    echo "🌐 Deploying to Netlify..."
    npx netlify deploy --prod --dir=dist
else
    echo "📁 Build complete. Manual deployment required."
    echo "Build files are in the 'dist' directory."
fi

echo "✅ Deployment complete!"`;
	}

	private generateEASConfig(): string {
		return JSON.stringify(
			{
				cli: {
					version: '>= 3.0.0',
				},
				build: {
					development: {
						developmentClient: true,
						distribution: 'internal',
					},
					preview: {
						distribution: 'internal',
					},
					production: {},
				},
				submit: {
					production: {},
				},
			},
			null,
			2
		);
	}

	private generateAppConfig(): string {
		return JSON.stringify(
			{
				expo: {
					name: 'AIDE Mobile App',
					slug: 'aide-mobile',
					version: '1.0.0',
					orientation: 'portrait',
					icon: './assets/icon.png',
					userInterfaceStyle: 'light',
					splash: {
						image: './assets/splash.png',
						resizeMode: 'contain',
						backgroundColor: '#ffffff',
					},
					assetBundlePatterns: ['**/*'],
					ios: {
						supportsTablet: true,
						bundleIdentifier: 'com.aide.mobile',
					},
					android: {
						adaptiveIcon: {
							foregroundImage: './assets/adaptive-icon.png',
							backgroundColor: '#FFFFFF',
						},
						package: 'com.aide.mobile',
					},
					web: {
						favicon: './assets/favicon.png',
					},
				},
			},
			null,
			2
		);
	}

	private generateTauriConfig(): string {
		return JSON.stringify(
			{
				build: {
					beforeBuildCommand: 'npm run build',
					beforeDevCommand: 'npm run dev',
					devPath: 'http://localhost:3000',
					distDir: '../dist',
				},
				package: {
					productName: 'AIDE Desktop',
					version: '1.0.0',
				},
				tauri: {
					allowlist: {
						all: false,
						shell: {
							all: false,
							open: true,
						},
						fs: {
							all: false,
							readFile: true,
							writeFile: true,
							scope: ['$DOCUMENT/*', '$DESKTOP/*'],
						},
					},
					bundle: {
						active: true,
						category: 'DeveloperTool',
						copyright: '',
						externalBin: [],
						icon: [
							'icons/32x32.png',
							'icons/128x128.png',
							'icons/128x128@2x.png',
							'icons/icon.icns',
							'icons/icon.ico',
						],
						identifier: 'com.aide.desktop',
						longDescription: '',
						macOS: {
							entitlements: null,
							exceptionDomain: '',
							frameworks: [],
							providerShortName: null,
							signingIdentity: null,
						},
						resources: [],
						shortDescription: '',
						targets: 'all',
						windows: {
							certificateThumbprint: null,
							digestAlgorithm: 'sha256',
							timestampUrl: '',
						},
					},
					security: {
						csp: null,
					},
					updater: {
						active: false,
					},
					windows: [
						{
							fullscreen: false,
							height: 600,
							resizable: true,
							title: 'AIDE Desktop',
							width: 800,
						},
					],
				},
			},
			null,
			2
		);
	}

	private generateCargoToml(): string {
		return `[package]
name = "aide-desktop"
version = "1.0.0"
description = "AIDE AI Development Environment - Desktop"
authors = ["AIDE Team"]
license = ""
repository = ""
default-run = "aide-desktop"
edition = "2021"
rust-version = "1.60"

[build-dependencies]
tauri-build = { version = "1.0", features = [] }

[dependencies]
serde_json = "1.0"
serde = { version = "1.0", features = ["derive"] }
tauri = { version = "1.0", features = ["api-all"] }

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]`;
	}

	private generateDockerfile(): string {
		return `# Multi-stage build for optimization
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S app -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=app:nodejs /app/dist ./dist
COPY --from=builder --chown=app:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=app:nodejs /app/package.json ./package.json

# Switch to app user
USER app

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]`;
	}

	private generateDockerCompose(): string {
		return `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/aide
    depends_on:
      - db
      - redis
    restart: unless-stopped
    networks:
      - aide-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=aide
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - aide-network

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    networks:
      - aide-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - aide-network

volumes:
  postgres_data:

networks:
  aide-network:
    driver: bridge`;
	}

	private generateDockerIgnore(): string {
		return `node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.tmp
.DS_Store
.vscode
.idea
*.log
.cache
dist/*.map`;
	}

	private generateTerraformConfig(): string {
		return `# Terraform configuration for AIDE deployment
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "aide-vpc"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "aide-igw"
    Environment = var.environment
  }
}

# Subnets
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "\${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name        = "aide-public-1"
    Environment = var.environment
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "\${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name        = "aide-public-2"
    Environment = var.environment
  }
}

# Security Groups
resource "aws_security_group" "web" {
  name_prefix = "aide-web-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "aide-web-sg"
    Environment = var.environment
  }
}

# Load Balancer
resource "aws_lb" "main" {
  name               = "aide-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.web.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  tags = {
    Name        = "aide-lb"
    Environment = var.environment
  }
}

# Outputs
output "load_balancer_dns" {
  value = aws_lb.main.dns_name
}`;
	}

	private generateKubernetesDeployment(): string {
		return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: aide-app
  labels:
    app: aide-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: aide-app
  template:
    metadata:
      labels:
        app: aide-app
    spec:
      containers:
      - name: aide-app
        image: aide/app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: aide-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: aide-service
spec:
  selector:
    app: aide-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: aide-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - aide.example.com
    secretName: aide-tls
  rules:
  - host: aide.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: aide-service
            port:
              number: 80`;
	}
}
