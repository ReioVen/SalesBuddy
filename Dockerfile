# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --only=production
WORKDIR /app/server
RUN npm ci --only=production
WORKDIR /app/client
RUN npm ci

# Copy source code
WORKDIR /app
COPY . .

# Build client
WORKDIR /app/client
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy server dependencies and source
COPY --from=builder /app/server/package*.json ./
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server ./

# Copy built client
COPY --from=builder /app/client/build ./public

# Expose port
EXPOSE 5002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5002/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start server
CMD ["npm", "start"]
