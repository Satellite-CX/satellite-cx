FROM node:24-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && \
    apk add --no-cache libc6-compat && \
    apk update

FROM base AS builder

WORKDIR /app
RUN pnpm add --global turbo
COPY . .
RUN turbo prune docs --docker

FROM base AS installer

WORKDIR /app

COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

RUN pnpm install

FROM oven/bun:alpine AS docs-generator

WORKDIR /app

COPY --from=installer /app .

RUN cd apps/docs && bun run generate:docs

FROM installer AS builder-final

COPY --from=docs-generator /app/apps/docs /app/apps/docs

RUN pnpm turbo build --filter=docs --only

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder-final /app/apps/docs/next.config.ts .
COPY --from=builder-final /app/apps/docs/package.json .

COPY --from=builder-final --chown=nextjs:nodejs /app/apps/docs/.next/standalone ./
COPY --from=builder-final --chown=nextjs:nodejs /app/apps/docs/.next/static ./apps/docs/.next/static
 
ENV PORT=80
EXPOSE 80

CMD node apps/docs/server.js