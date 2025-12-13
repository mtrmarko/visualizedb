# syntax=docker/dockerfile:1.4
ARG NODE_VERSION=20-slim

FROM node:${NODE_VERSION} AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install OpenSSL (required for Prisma) and other dependencies
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# -----------------------------------------------------------------------------
# Builder Stage
# -----------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL


# Copy pnpm-lock.yaml and package.json files first to leverage Docker cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/client/package.json apps/client/
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/

# Install root dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build all projects in the monorepo
RUN pnpm run build

# Deploy the server application into a production-ready directory
# This command creates a standalone folder for the server with only its production dependencies
RUN pnpm deploy --filter=visualizedb-server --prod /prod/server --legacy
# Ensure the dist folder from the server build is copied into the deployed directory
RUN cp -r apps/server/dist /prod/server/dist
# Ensure the prisma folder is copied for schema access (e.g., migrations or schema checks)
RUN cp -r apps/server/prisma /prod/server/prisma

# Generate Prisma client in the production directory
WORKDIR /prod/server
RUN npx prisma generate
WORKDIR /app


# -----------------------------------------------------------------------------
# Runner Stage
# -----------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Default DATABASE_URL for SQLite to a file inside the /app/data volume
ENV DATABASE_URL="file:/app/data/visualizedb.sqlite"
# Path where the client (frontend) build artifacts are located for the server to serve
ENV CLIENT_BUILD_PATH="/app/client"

# Create a non-root user and group
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Create a directory for persistent data and set ownership (must be done as root)
RUN mkdir -p /app/data && chown expressjs:nodejs /app/data

USER expressjs

# Copy the deployed server application
COPY --from=builder --chown=expressjs:nodejs /prod/server /app/server

# Copy the client (frontend) build artifacts
COPY --from=builder --chown=expressjs:nodejs /app/apps/client/dist /app/client

# Copy and setup entrypoint script
COPY --chown=expressjs:nodejs apps/server/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE ${PORT}

# Start the server using the entrypoint script
CMD ["/app/docker-entrypoint.sh"]
