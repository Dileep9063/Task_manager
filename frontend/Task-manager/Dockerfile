# ============================================================
# Task Manager frontend - production image
# ============================================================

# ---------- Build stage ----------
FROM node:20-slim AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# The backend URL to bake into the production build. Override at build
# time with: docker build --build-arg VITE_API_BASE_URL=https://api.example.com
ARG VITE_API_BASE_URL=http://localhost:5000
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# ---------- Serve stage ----------
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Railway (and most PaaS) assign a dynamic $PORT at runtime that the
# container must bind to - it can differ between deploys, so it can't be
# baked in at build time. The official nginx image auto-renders any
# *.template file in /etc/nginx/templates/ via envsubst on container
# start, substituting ${PORT} below. Defaults to 80 for local
# `docker run` / docker-compose use where no PORT is set.
ENV PORT=80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
