FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Optional public API base for OpenAPI docs. If empty, frontend uses current origin.
ARG VITE_API_PUBLIC_BASE=
ENV VITE_API_PUBLIC_BASE=$VITE_API_PUBLIC_BASE

# Optional Google OAuth Client ID. If empty, the login button may be hidden.
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Optional static assets CDN base. Defaults to https://cdn.viraltok.ai
ARG VITE_ASSET_BASE=https://cdn.viraltok.ai
ENV VITE_ASSET_BASE=$VITE_ASSET_BASE

RUN npm run build

FROM nginx:alpine
RUN apk add --no-cache gettext ca-certificates
WORKDIR /usr/share/nginx/html

COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/nginx/nginx-ssl.conf /etc/nginx/ssl-config/nginx-ssl.conf
COPY deploy/docker/frontend-entrypoint.sh /docker-entrypoint-ssl.sh
RUN chmod +x /docker-entrypoint-ssl.sh

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
EXPOSE 443

ENTRYPOINT ["/docker-entrypoint-ssl.sh"]
