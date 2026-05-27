# Build stage — installs deps, generates Prisma client, typechecks
FROM node:20-alpine AS builder
RUN corepack enable

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/db/package.json ./packages/db/
COPY packages/api-spec/package.json ./packages/api-spec/
COPY packages/sdk/package.json ./packages/sdk/
COPY apps/server/package.json ./apps/server/

RUN pnpm install --frozen-lockfile

# Copy full source
COPY . .

# Generate Prisma client and catch type errors at build time
RUN pnpm --filter "./packages/db" exec prisma generate
RUN pnpm --filter "./apps/server" typecheck

# Runtime stage — tsx runs TypeScript source directly, handling workspace TS packages
FROM node:20-alpine AS runner
RUN corepack enable

WORKDIR /app
ENV NODE_ENV=production

# Copy only what the server needs at runtime
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/api-spec ./packages/api-spec
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/apps/server/src ./apps/server/src
COPY --from=builder /app/apps/server/package.json ./apps/server/

EXPOSE 3001
# tsx resolves @project/db and other workspace TypeScript packages correctly
CMD ["node_modules/.bin/tsx", "apps/server/src/index.ts"]
