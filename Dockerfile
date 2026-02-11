FROM node:18-alpine AS base

# Stage 1: Build NestJS API
FROM base AS api-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.base.json ./
COPY apps/api/ ./apps/api/
COPY libs/ ./libs/
RUN npx tsc -p apps/api/tsconfig.json && npx tsc-alias -p apps/api/tsconfig.json

# Stage 2: Build Angular dashboard
FROM base AS dashboard-build
WORKDIR /app/apps/dashboard
COPY apps/dashboard/package*.json ./
RUN npm ci
COPY apps/dashboard/ .
RUN npx ng build --configuration=production

# Stage 3: Production
FROM base AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=api-build /app/dist ./dist
COPY --from=dashboard-build /app/apps/dashboard/dist/dashboard/browser ./public

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/apps/api/apps/api/src/main.js"]
