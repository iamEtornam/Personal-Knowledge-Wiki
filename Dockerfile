FROM node:22-alpine AS base

# --- Install dependencies ---
FROM base AS deps
WORKDIR /app/wiki-ui
COPY wiki-ui/package.json wiki-ui/package-lock.json* ./
RUN npm ci

# --- Build ---
FROM base AS builder
WORKDIR /app

COPY . .
COPY --from=deps /app/wiki-ui/node_modules wiki-ui/node_modules

RUN mkdir -p wiki

WORKDIR /app/wiki-ui
RUN npm run build

# --- Production ---
FROM base AS runner
RUN apk add --no-cache python3 py3-pip && \
    pip install --no-cache-dir --break-system-packages pdfplumber
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

RUN mkdir -p data raw/entries wiki && chown -R nextjs:nodejs /app

COPY --from=builder --chown=nextjs:nodejs /app/wiki/ wiki/
COPY --from=builder --chown=nextjs:nodejs /app/wiki-config.json* ./
COPY --from=builder --chown=nextjs:nodejs /app/ingest.py ./

# Standalone output placed under wiki-ui/ so that
# process.cwd() + "/../wiki" resolves to /app/wiki at runtime.
COPY --from=builder --chown=nextjs:nodejs /app/wiki-ui/.next/standalone wiki-ui/
COPY --from=builder --chown=nextjs:nodejs /app/wiki-ui/public wiki-ui/public
COPY --from=builder --chown=nextjs:nodejs /app/wiki-ui/.next/static wiki-ui/.next/static

WORKDIR /app/wiki-ui
USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
