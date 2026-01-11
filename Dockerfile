# syntax=docker.io/docker/dockerfile:1

# =============================================================================
# SECURITY NOTE: Only NEXT_PUBLIC_* variables should be build-time ARGs
# All secrets (DATABASE_URL, ENCRYPTION_KEY, NEXTAUTH_SECRET, etc.) 
# should be set as RUNTIME environment variables in Coolify, not build args
# =============================================================================

# 1. Update to Node 22 (Alpine version recommended for small size)
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# libc6-compat is needed for many Node native packages on Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
# Copy prisma schema for prisma client generation during install
COPY prisma ./prisma

# --- FIX: Set memory limit to 6GB for the install step ---
ENV NODE_OPTIONS="--max-old-space-size=6144"

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder

# Only accept NEXT_PUBLIC_* ARGs that will be baked into the client bundle
# These are safe to expose in logs since they're public anyway
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_PROJECT_FINANCE_FEATURE

# Coolify metadata (safe to expose)
ARG SOURCE_COMMIT
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG COOLIFY_BRANCH
ARG COOLIFY_RESOURCE_UUID
ARG COOLIFY_CONTAINER_NAME

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# --- FIX: Set memory limit to 6GB for the build step ---
ENV NODE_OPTIONS="--max-old-space-size=6144"

# Disable telemetry during the build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Make NEXT_PUBLIC_* variables available to Next.js build
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_PROJECT_FINANCE_FEATURE=${NEXT_PUBLIC_PROJECT_FINANCE_FEATURE}

# Generate and Build the application (Your custom command)
RUN npx prisma generate && npm run build && npm run build:workers && cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 2. Create the non-root user and group
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Install sudo for privilege escalation
RUN apk add --no-cache sudo shadow

# SECURITY: ROOT_PASSWORD should be set at runtime via environment variable
# If you need to set it during build, use Docker BuildKit secrets instead
# For now, we'll use a placeholder that should be overridden at runtime
ARG ROOT_PASSWORD=change-me-in-production
RUN echo "root:${ROOT_PASSWORD}" | chpasswd

# Allow nextjs user to use sudo
RUN echo "nextjs ALL=(ALL) NOPASSWD: /usr/local/bin/node" > /etc/sudoers.d/nextjs && \
    echo "nextjs ALL=(ALL) NOPASSWD: /usr/local/bin/npx" >> /etc/sudoers.d/nextjs && \
    echo "nextjs ALL=(ALL) NOPASSWD: /usr/local/bin/npm" >> /etc/sudoers.d/nextjs && \
    echo "nextjs ALL=(ALL) NOPASSWD: /bin/su" >> /etc/sudoers.d/nextjs && \
    chmod 0440 /etc/sudoers.d/nextjs

# Install Prisma CLI globally with correct ownership
RUN npm install -g prisma@6.19.0 && \
    chown -R nextjs:nodejs /usr/local/lib/node_modules && \
    chown -R nextjs:nodejs /usr/local/bin

# Copy public folder with correct permissions
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy prisma schema and generated client for runtime
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy package.json for npm scripts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 4. Switch to the non-root user
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

