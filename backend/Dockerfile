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

# Install system build dependencies required for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    sqlite3 \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/package.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist ./public

RUN mkdir -p /app/data /hlds_data

EXPOSE 1337

CMD ["npm", "start"]