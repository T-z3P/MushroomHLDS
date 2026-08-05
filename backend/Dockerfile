# Stage 1: Build Frontend Assets
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:20-slim

WORKDIR /app

# Install system utilities (curl/ca-certificates needed for prebuilt binary downloads)
RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend package manifests
COPY backend/package*.json ./

# Install production dependencies (lets better-sqlite3 download prebuilt binaries)
RUN npm install --omit=dev --legacy-peer-deps

# Copy backend application source code
COPY backend/ ./

# Copy compiled frontend static assets from Stage 1 into backend's static directory
COPY --from=frontend-builder /app/frontend/dist ./public

# Ensure runtime persistent directories exist
RUN mkdir -p /app/data /hlds_data

EXPOSE 1337

CMD ["npm", "start"]