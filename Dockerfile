# ── Stage 1: Build React frontend ────────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Production image ────────────────────────────────────────────────
FROM node:20-alpine

# better-sqlite3 needs build tools on Alpine
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install backend production deps (includes native build for better-sqlite3)
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY backend/src ./src

# Copy built frontend into location server will serve
COPY --from=frontend-build /build/frontend/dist ./frontend/dist

# Persistent data lives in a volume
RUN mkdir -p /data/downloads

ENV NODE_ENV=production
ENV DOWNLOAD_PATH=/data/downloads
ENV PORT=3000

EXPOSE 3000
CMD ["node", "src/server.js"]
