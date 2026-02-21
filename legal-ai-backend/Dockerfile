# Production Dockerfile for Node.js Backend
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies (use cache)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Security: Run as non-privileged user
USER node

# Expose port
EXPOSE 5000

# Start application
CMD [ "node", "server.js" ]
