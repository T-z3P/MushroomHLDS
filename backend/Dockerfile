# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
RUN apk add --no-cache python3 make g++
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend & Production Image
FROM node:20-alpine
RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app
COPY backend/package*.json ./
RUN npm install

COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist ./public

RUN mkdir -p /app/data /hlds_data

EXPOSE 1337

CMD ["npm", "start"]