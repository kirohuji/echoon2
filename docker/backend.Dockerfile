FROM node:22-alpine AS builder

WORKDIR /app
ARG NPM_REGISTRY=https://registry.npmmirror.com

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm config set registry ${NPM_REGISTRY}
RUN pnpm install --frozen-lockfile

COPY apps/backend apps/backend

RUN pnpm --filter @echoon2/backend prisma:generate
RUN pnpm --filter @echoon2/backend build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ARG NPM_REGISTRY=https://registry.npmmirror.com

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm config set registry ${NPM_REGISTRY}
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/apps/backend/dist apps/backend/dist
COPY --from=builder /app/apps/backend/prisma apps/backend/prisma
RUN pnpm --filter @echoon2/backend prisma:generate

WORKDIR /app/apps/backend

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
