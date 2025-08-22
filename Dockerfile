# Сборка
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

COPY . .
RUN npm run build

# Прод 
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache postgresql-client

COPY package*.json ./
COPY prisma ./prisma
# ВАЖНО: чтобы migrate работал, пакет "prisma" должен быть доступен в рантайме.
# Либо держите "prisma" в dependencies, либо уберите --omit=dev.
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER node
EXPOSE 3000
CMD ["/entrypoint.sh"]
