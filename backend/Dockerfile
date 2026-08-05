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

# Install build essential dependencies required by native C++ modules (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend package manifests
COPY backend/package*.json ./

# Install dependencies with explicit build-from-source flag for native modules
RUN npm install --omit=dev --legacy-peer-deps --build-from-source

# Copy backend application source code
COPY backend/ ./

# Copy compiled frontend static assets from Stage 1 into backend's static directory
COPY --from=frontend-builder /app/frontend/dist ./public

# Ensure runtime persistent directories exist
RUN mkdir -p /app/data /hlds_data

EXPOSE 1337

CMD ["npm", "start"]