# Stage 1: Build Frontend (Alpine)
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps

COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend & Production Image (Debian Slim for Native Modules)
FROM node:20-slim

# Install python and build tools required for native gyp modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --only=production --legacy-peer-deps

COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist ./public

RUN mkdir -p /app/data /hlds_data

EXPOSE 1337

CMD ["npm", "start"]