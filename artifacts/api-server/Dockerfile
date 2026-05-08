# ── Stage 1: Build ────────────────────────────────────────────────────────────
# Installs dependencies and runs esbuild to produce a self-contained bundle.
FROM node:20-slim AS builder

RUN npm install -g pnpm@10.26.1

WORKDIR /app

# Copy workspace manifests first (maximises Docker layer cache reuse)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy only the packages needed by the API server
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# esbuild bundles every workspace:* dep into a single dist/index.mjs
RUN pnpm --filter @workspace/api-server run build

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
# Tiny final image — only the pre-built bundle, no node_modules, no source.
FROM node:20-slim

WORKDIR /app

COPY --from=builder /app/artifacts/api-server/dist ./dist

EXPOSE 8080
ENV NODE_ENV=production

CMD ["node", "--enable-source-maps", "dist/index.mjs"]
