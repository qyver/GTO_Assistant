FROM node:20-alpine AS production

WORKDIR /app

# Copy root package.json (workspaces config)
COPY package.json package-lock.json* ./

# Copy workspace package.json files
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies
RUN npm install

# Copy source files
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Build API
WORKDIR /app/apps/api
RUN npm run build

# Generate Prisma client (build-time, no DATABASE_URL needed)
RUN npx prisma generate

EXPOSE 3001

# Run migrations at container startup, then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
