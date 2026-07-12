# DentNow frontend image — Vite build served by nginx with a runtime-generated
# config.json and an /api reverse proxy to the backend.

# ── Stage 1: build the SPA ──
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --ignore-scripts; else npm install --ignore-scripts; fi
COPY . .
RUN npm run build

# ── Stage 2: nginx runtime ──
FROM nginx:1.27-alpine AS production
RUN apk add --no-cache jq curl && rm -f /etc/nginx/conf.d/default.conf

# nginx envsubst's this template into /etc/nginx/conf.d/ at startup (${API_UPSTREAM}).
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
# Runs after envsubst; generates /config.json from env.
COPY docker-entrypoint.d/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=5 \
  CMD curl -fsS http://localhost/config.json || exit 1

# Base image's entrypoint runs /docker-entrypoint.d/* then starts nginx.
CMD ["nginx", "-g", "daemon off;"]
