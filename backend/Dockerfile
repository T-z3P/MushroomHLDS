# Stage 1: Build Frontend Assets
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:20-slim

WORKDIR /app

# Install system build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    sqlite3 \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy ONLY package.json (ignoring lockfiles that break docker builds)
COPY backend/package.json ./

# Clean install from registry
RUN npm install --omit=dev --legacy-peer-deps

# Copy backend application source code
COPY backend/ ./

# Copy compiled frontend static assets from Stage 1 into backend's static directory
COPY --from=frontend-builder /app/frontend/dist ./public

# Ensure runtime persistent directories exist
RUN mkdir -p /app/data /hlds_data

EXPOSE 1337

CMD ["npm", "start"]