# syntax=docker/dockerfile:1
# Full-stack combined container: nginx (SPA) + Node/Express backend under supervisord.

# ---------- Frontend build ----------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/web
COPY web/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund --loglevel=error || \
    npm install --no-audit --no-fund --loglevel=error
COPY web/ ./
RUN npx vite build

# ---------- Backend build ----------
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund --loglevel=error || \
    npm install --no-audit --no-fund --loglevel=error
RUN npx prisma generate
COPY backend/ ./
RUN npm run build \
    && test -n "$(find /app/backend/dist -name server.js | head -1)" \
       || (echo 'ERROR: no server.js in dist — check tsconfig rootDir' && exit 1)

# ---------- Runtime ----------
FROM node:20-alpine AS runtime
RUN apk add --no-cache nginx supervisor

# Backend runtime files (compiled dist + node_modules + package.json + prisma)
WORKDIR /app/backend
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/package.json ./package.json
COPY --from=backend-builder /app/backend/prisma ./prisma

# Frontend static bundle
COPY --from=frontend-builder /app/web/dist /usr/share/nginx/html

# nginx + supervisord configs
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY supervisord.conf /etc/supervisord.conf

# nginx expects /run/nginx and /var/log/nginx to exist
RUN mkdir -p /run/nginx /var/log/nginx

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
