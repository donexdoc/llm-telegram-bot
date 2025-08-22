#!/bin/sh
set -e

# Минималистичное ожидание доступности порта БД из DATABASE_URL
# (работает и без внешних утилит; при желании замени на pg_isready)
if [ -n "$DATABASE_URL" ]; then
  host=$(echo "$DATABASE_URL" | sed -E 's|.*://[^:@/]+:([^@/]+)@([^:/]+):?([0-9]*)/.*|\2|')
  port=$(echo "$DATABASE_URL" | sed -E 's|.*://[^:@/]+:([^@/]+)@([^:/]+):?([0-9]*)/.*|\3|')
  [ -z "$port" ] && port=5432
  echo "⏳ Жду БД $host:$port ..."
  tries=0
  while ! (exec 3<>/dev/tcp/$host/$port) 2>/dev/null; do
    tries=$((tries+1))
    [ $tries -gt 60 ] && echo "❌ БД недоступна" && exit 1
    sleep 1
  done
fi

echo "🚀 Применяю миграции..."
npx prisma migrate deploy

echo "🏃 Запускаю приложение..."
node dist/main.js
