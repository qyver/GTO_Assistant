FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

WORKDIR /app

EXPOSE 3001

CMD ["npm", "run", "dev", "--workspace=apps/api"]
