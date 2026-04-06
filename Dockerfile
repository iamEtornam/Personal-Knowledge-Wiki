FROM node:22-alpine AS base

# --- Install dependencies ---
FROM base AS deps
WORKDIR /app/wiki-ui
COPY wiki-ui/package.json wiki-ui/package-lock.json* ./
RUN npm ci

# --- Build ---
FROM base AS builder
WORKDIR /app

COPY wiki/ wiki/
COPY wiki-config.json* ./
COPY wiki-ui/ wiki-ui/
COPY --from=deps /app/wiki-ui/node_modules wiki-ui/node_modules

WORKDIR /app/wiki-ui
RUN npm run build

# --- Production ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/wiki/ wiki/
COPY --from=builder /app/wiki-config.json* ./

# Standalone output is flat — place it under wiki-ui/ so that
# process.cwd() + "/../wiki" resolves to /app/wiki at runtime.
COPY --from=builder --chown=nextjs:nodejs /app/wiki-ui/.next/standalone wiki-ui/
COPY --from=builder /app/wiki-ui/public wiki-ui/public
COPY --from=builder --chown=nextjs:nodejs /app/wiki-ui/.next/static wiki-ui/.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "wiki-ui/server.js"]
