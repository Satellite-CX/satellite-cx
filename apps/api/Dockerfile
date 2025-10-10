FROM oven/bun:alpine AS base

RUN apk add --update nodejs npm
RUN npm install -g corepack

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN apk update

WORKDIR /app

RUN pnpm add -g turbo

FROM base AS builder

COPY . .

RUN turbo prune api --docker

FROM base AS installer

COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN --mount=type=secret,id=npmrc,target=/root/.npmrc pnpm install

COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

FROM base AS transpiler

COPY --from=installer /app .

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN pnpm build --filter=api...

FROM base AS runner

RUN addgroup --system --gid 1001 hono
RUN adduser --system --uid 1001 hono
USER hono

COPY --from=transpiler /app/apps/api/build/index.js .

ENTRYPOINT ["bun", "run", "index.js"]

