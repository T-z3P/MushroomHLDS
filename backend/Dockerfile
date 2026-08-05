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

# Install complete build toolchain + SSL certs for downloading native binaries
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    sqlite3 \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend package manifests
COPY backend/package*.json ./

# Run npm install with verbose logging and no-audit to prevent silent crashes
RUN npm install --omit=dev --legacy-peer-deps --loglevel=verbose --no-audit

# Copy backend application source code
COPY backend/ ./

# Copy compiled frontend static assets from Stage 1 into backend's static directory
COPY --from=frontend-builder /app/frontend/dist ./public

# Ensure runtime persistent directories exist
RUN mkdir -p /app/data /hlds_data

EXPOSE 1337

CMD ["npm", "start"]