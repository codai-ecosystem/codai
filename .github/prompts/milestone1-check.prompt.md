---
mode: agent
---

# Milestone 1: AIDE Project Completion Check

Check initial.prompt.md.
Create, update, and verify that everything needed for a complete self-hosted and user-facing AIDE system is implemented properly. This includes the entire architecture from idea to business, based on what we’ve already discussed and started.

Start by understanding what the AIDE project is: a fully autonomous, AI-native development environment based on a fork of VS Code, where users build, test, deploy, and monetize applications just by talking to you, the Agent. Users don’t interact with code, terminals, or settings files manually. The agent interprets intent, plans architecture, writes code, sets up infrastructure, provisions services like Firebase, GitHub, Azure, and Stripe, and launches full applications based on prompt-driven workflows.

Your first step is to analyze the current state of the project, including:

The Azure OpenAI deployment at aide-openai-dev under the subscription AIDE Subscription Dev

Azure Entra ID configured with app registrations and GitHub Enterprise SSO

A GitHub organization created specifically for AIDE

Stripe Connect in test mode already configured

Firebase project aide-dev configured with Auth, Firestore, and Remote Config

Google Cloud project aide-dev with Cloud Run and service accounts ready

Vercel deployed landing page for AIDE public access

Environment variables fully defined in .env.local with all necessary service integrations

From there, build or validate the following components:

The Backend Service: a server running on Cloud Run that handles all provisioning logic (GitHub repos, Firebase projects, Stripe onboarding), user plan enforcement, webhook handling, Firestore updates, and agent runtime configuration.

Frontend Landing App: hosted on Vercel, includes animated marketing site, onboarding wizard, pricing section, download links for installers (macOS, Windows, Linux), and deep integration with Stripe and Firebase.

Agent Logic Runtime: responsible for memory persistence, concurrency control, prompt routing, Copilot integrations (if available), reactive updates, and interaction with all the services from user prompts.

Usage Tracking & Quota Enforcement: reads plan data from Firestore /plans, tracks usage in /users/{uid}/usage, and blocks or warns users when limits are exceeded. Resets quotas monthly using scheduled jobs or backend automation.

Billing System: based on Stripe Connect. Creates individual user accounts via hosted onboarding, and tracks subscriptions via webhook events (checkout.session.completed, subscription.updated, etc.). All pricing plans are managed dynamically via the server app and not hardcoded.

App & Deployment Configuration: all URLs, endpoints, package tiers, pricing details, and remote configurations are dynamically fetched from the backend, not hardcoded into any frontend or runtime. Any override can be done either via prompt or through the simple UI menu.

Admin & Dashboard Tools: includes the creation of a separate app for internal management of users, plans, usage stats, and service logs. This admin interface can be accessed securely with elevated roles.

Free Tier Handling: ensures that any user without a paid plan is still provisioned with a restricted tier that limits active instances, minutes of use, or concurrent agents. This tier is dynamic and configurable from the server, not hardcoded.

Initial Project Bootstrapping: when AIDE is launched for the first time on a new machine or by a new user, it checks if a backend URL is configured; if not, uses a default. The backend then delivers configuration, auth login, onboarding wizard, and downloads the proper setup for the Agent to function.

Documentation Milestone: create or update complete documentation files, changelogs, and onboarding guides to reflect the current state of the system. This includes public-facing docs (for users), internal architecture notes (for maintainers), and changelogs or release notes.

When you receive this prompt, first verify what has already been completed. Create a summary of what exists and what is missing. Then tell me a step-by-step plan to complete everything else. Don't change anything. Ask the user if you should proceed.
