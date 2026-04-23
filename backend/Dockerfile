FROM node:20-slim AS builder

WORKDIR /app

# Instalar dependencias necesarias para Prisma y SSL
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm install

COPY backend/ ./
RUN npx prisma generate

FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app /app
EXPOSE 3009

# Forzar ignorar SSL por la red de Hostinger si es necesario
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

CMD ["npx", "tsx", "index.ts"]
