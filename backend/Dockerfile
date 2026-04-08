# ─────────────────────────────────────────────────────────────
# Artesanias Backend - Production Dockerfile
# ─────────────────────────────────────────────────────────────

FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar todas las dependencias
RUN npm install --include=dev

# Copiar codigo fuente
COPY . .

# Verificar que prisma existe
RUN ls -la node_modules/.bin/ | grep prisma

# Generar Prisma Client para Linux
RUN node node_modules/prisma/build/index.js generate

# Compilar TypeScript
RUN node node_modules/.bin/tsc

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copiar archivos compilados
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copiar Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copiar package files e instalar solo produccion
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

RUN mkdir -p /app/logs

RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "dist/server.js"]
