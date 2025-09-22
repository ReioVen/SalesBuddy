# Railway-optimized Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy server package files
COPY server/package*.json ./

# Install server dependencies
RUN npm ci --only=production

# Copy server source code
COPY server/ .

# Expose port
EXPOSE 5002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5002/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start server
CMD ["npm", "start"]
