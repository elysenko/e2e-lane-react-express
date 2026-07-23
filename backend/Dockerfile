# syntax=docker/dockerfile:1
# Real-build backend image (combo known_good_dockerfiles=false: the pipeline TRUSTS
# this file — keep the build+artifact+runtime stages and the migrate-then-start CMD).
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund --loglevel=error
COPY . .
RUN npx prisma generate
RUN npm run build
FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Self-contained SQLite: no external DB/secret is provisioned, so the container owns its
# own data file. DATA_DIR/app.db is created below and matches lib/prisma.ts's fallback.
ENV DATA_DIR=/app/data
ENV DATABASE_URL=file:/app/data/app.db
COPY --from=build /app ./
RUN mkdir -p /app/data
EXPOSE 3000
# `prisma db push` creates the SQLite schema from scratch on every boot (idempotent, no
# migration history needed for an ephemeral DB); task seeding runs in server.js on startup.
CMD sh -c 'npx prisma db push --skip-generate --accept-data-loss || true; npm run start:prod'
