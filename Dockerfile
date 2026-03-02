FROM node:20-alpine

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

# Generate Prisma client and run migrations
RUN npx prisma generate
RUN npx prisma migrate deploy

EXPOSE 3001

CMD ["node", "dist/index.js"]
