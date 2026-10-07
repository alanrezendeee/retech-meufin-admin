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
# VITE_API_BASE_URL normalmente fica VAZIA: a API é servida same-origin em /api/
# pelo nginx abaixo (API_UPSTREAM, variável de RUNTIME).
ARG VITE_API_BASE_URL
ARG VITE_AUTH_USE_MOCK
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_AUTH_USE_MOCK=$VITE_AUTH_USE_MOCK

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Template renderizado no start pelo entrypoint oficial (envsubst em
# /etc/nginx/templates/*.template → /etc/nginx/conf.d/*.conf).
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# URL da meufin-api para o proxy /api/ (runtime). Railway: preferir a URL
# interna, ex.: http://retech-meufin-api.railway.internal:8002
ENV API_UPSTREAM=http://localhost:8002

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
