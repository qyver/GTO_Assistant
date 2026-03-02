FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

WORKDIR /app

EXPOSE 5173

CMD ["npm", "run", "dev", "--workspace=apps/web"]
