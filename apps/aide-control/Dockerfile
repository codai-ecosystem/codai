# Use the official Node.js 18 image
FROM node:18-alpine AS base

# Set common environment variables
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

# Install dependencies only when needed
FROM base AS deps

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./

# Use pnpm for faster, more reliable dependency installation
RUN corepack enable pnpm && \
    pnpm i --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Set build-time environment
ENV NODE_ENV=production

# Copy dependency information and installation
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js application with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable pnpm && pnpm run build

# Add build info for traceability
RUN echo "AIDE Control Panel - Build date: $(date)" > ./build-info.txt

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/build-info.txt ./

# Set up Next.js directory structure
RUN mkdir .next && chown nextjs:nodejs .next

# Copy standalone build and static assets (optimized by output traces)
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user for security
USER nextjs

# Create health check endpoint
RUN echo '// Simple health check endpoint\nmodule.exports = function(req, res) { res.status(200).send("OK"); };' > ./health.js

# Expose the port the app will run on
EXPOSE 8080

# Add Docker labels for better image management
LABEL org.opencontainers.image.title="AIDE Control Panel" \
      org.opencontainers.image.description="Admin control panel for AIDE self-hosted deployments" \
      org.opencontainers.image.created="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
      org.opencontainers.image.source="https://github.com/microsoft/AIDE"

# Start the application
# server.js is created by next build from the standalone output
CMD ["node", "server.js"]
