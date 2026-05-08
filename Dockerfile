FROM node:20-slim

WORKDIR /app

# Enable corepack and activate pnpm
RUN corepack enable && corepack prepare pnpm@10 --activate

# Copy workspace manifests first (better layer caching)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all lib packages (workspace deps used by api-server)
COPY lib/ ./lib/

# Copy api-server source
COPY artifacts/api-server/ ./artifacts/api-server/

# Install all dependencies with pnpm (correctly resolves workspace:*)
RUN pnpm install --frozen-lockfile

# Build — esbuild bundles all workspace code into a single dist/index.mjs
RUN pnpm --filter @workspace/api-server run build

EXPOSE 8080

# Push DB schema then start server
CMD ["sh", "-c", "pnpm --filter @workspace/db run push && node --enable-source-maps artifacts/api-server/dist/index.mjs"]
