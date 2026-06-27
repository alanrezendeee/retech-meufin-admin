# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Vars de build do Vite — assadas no bundle (import.meta.env) durante npm run build.
# Railway injeta estes ARG a partir das Service Variables (precisam estar declarados).
ARG VITE_AUTH_BASE_URL
ARG VITE_API_BASE_URL
ARG VITE_AUTH_ENDPOINT_AUTHENTICATE
ARG VITE_AUTH_ENDPOINT_ME
ARG VITE_AUTH_USE_MOCK
ENV VITE_AUTH_BASE_URL=$VITE_AUTH_BASE_URL \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_AUTH_ENDPOINT_AUTHENTICATE=$VITE_AUTH_ENDPOINT_AUTHENTICATE \
    VITE_AUTH_ENDPOINT_ME=$VITE_AUTH_ENDPOINT_ME \
    VITE_AUTH_USE_MOCK=$VITE_AUTH_USE_MOCK

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

