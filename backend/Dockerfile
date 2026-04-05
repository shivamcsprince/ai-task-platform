# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --only=production

# ─── Stage 2: Development ─────────────────────────────────────────────────────
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# ─── Stage 3: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only production deps from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "src/server.js"]
