# Codai Service - Copilot Instructions

## Service Overview

**Central Platform & AIDE Hub** - Priority 1 service in the Codai Ecosystem

- **Domain**: codai.ro (or subdomain)
- **Port**: 3000
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS

## Development Context

This is a central platform & aide hub service that is part of the larger Codai ecosystem. The service should:

1. **Follow Codai Design System**: Use consistent UI patterns and components
2. **Integrate with Core Services**: Connect with memorai (memory), logai (auth), and codai (central)
3. **Maintain Performance**: Optimize for fast loading and responsive interactions
4. **Ensure Accessibility**: Follow WCAG guidelines and semantic HTML

## Code Style & Patterns

### TypeScript

- Use strict TypeScript configuration
- Define proper interfaces and types
- Prefer type inference where possible
- Use generic types for reusable components

### React/Next.js

- Use functional components with hooks
- Implement proper error boundaries
- Use Next.js App Router (app/ directory)
- Optimize images with next/image
- Implement proper SEO with metadata

### Styling

- Use Tailwind CSS utilities
- Create reusable component classes
- Follow mobile-first responsive design
- Use CSS variables for theming

### File Organization

```
codai/
├── app/                 # Next.js App Router
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # Reusable UI components
├── lib/               # Utility functions
├── types/             # TypeScript definitions
└── public/            # Static assets
```

## API Integration

When integrating with other Codai services:

1. **Authentication**: Use LogAI for user authentication
2. **Memory/State**: Use MemorAI for persistent data
3. **Core Features**: Leverage Codai central platform APIs

## Testing

- Write unit tests for utilities and components
- Use Vitest for testing framework
- Test user interactions and edge cases
- Maintain good test coverage

## Performance

- Implement code splitting
- Use React.lazy for dynamic imports
- Optimize bundle size
- Monitor Core Web Vitals

## Deployment

- Build optimized for production
- Use environment variables for configuration
- Implement proper error logging
- Set up health checks

## AI-Specific Considerations

As an AI-native service:

- Implement proper loading states for AI operations
- Handle async AI responses gracefully
- Provide meaningful error messages
- Consider progressive enhancement for AI features

---

**Remember**: This service is part of a larger ecosystem. Always consider how changes might affect other services and maintain consistency across the platform.
