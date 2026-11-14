# Multi-stage Dockerfile for Metropolitan University CPCS Backend API
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source and prisma schema
COPY prisma ./prisma/
COPY src ./src/

# Generate custom Prisma Client
RUN npx prisma generate

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy generated Prisma client and built backend files from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

CMD ["node", "src/server.js"]

