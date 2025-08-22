#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  host=$(echo "$DATABASE_URL" | sed -E 's|.*://[^@]+@([^:/]+).*|\1|')
  port=$(echo "$DATABASE_URL" | sed -E 's|.*://[^@]+@[^:/]+:?([0-9]*).*|\1|')
  [ -z "$port" ] && port=5432
  echo "⏳ Жду БД ${host}:${port} ..."

  tries=0
  until pg_isready -h "$host" -p "$port" -q; do
    tries=$((tries+1))
    [ $tries -gt 60 ] && echo "❌ БД недоступна" && exit 1
    sleep 1
  done
fi

echo "🚀 Применяю миграции..."
npx prisma migrate deploy
echo "🏃 Запускаю приложение..."
node dist/main.js
