# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
RUN apk add --no-cache python3 make g++ git
WORKDIR /app/frontend

COPY frontend/package*.json ./
# Use --legacy-peer-deps to prevent peer dependency tree crashes
RUN npm install --legacy-peer-deps

COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend & Production Image
FROM node:20-alpine
RUN apk add --no-cache python3 make g++ sqlite git

WORKDIR /app

COPY backend/package*.json ./
# Use --build-from-source for native binaries like better-sqlite3
RUN npm install --legacy-peer-deps --build-from-source

COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist ./public

RUN mkdir -p /app/data /hlds_data

EXPOSE 1337

CMD ["npm", "start"]