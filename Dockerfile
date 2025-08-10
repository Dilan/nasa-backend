# --- Build Stage ---
FROM node:22-alpine AS build

WORKDIR /app

RUN apk add --no-cache openssl

# Install dependencies
COPY package*.json ./
RUN npm i

# Copy source code
COPY . .

# Build NestJS app
RUN npm run build

# --- Production Stage ---
FROM node:22-alpine AS production

WORKDIR /app

# Install OpenSSL compatibility
RUN apk add --no-cache openssl

# Install curl
RUN apk add --no-cache curl

# Install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 4200

ENV NODE_ENV=production
ENV PORT=4200

# Start the application
CMD node dist/main.js
