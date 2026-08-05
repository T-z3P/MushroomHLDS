FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

# Copy built frontend assets to backend static directory
COPY --from=frontend-builder /app/frontend/dist ./public

RUN mkdir -p /app/data /hlds_data

EXPOSE 3000

CMD ["npm", "start"]