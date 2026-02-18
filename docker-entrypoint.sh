#!/bin/sh
#
# This script is the entrypoint for the Docker container.
# It ensures the database is ready before running migrations and starting the app.


# Exit immediately if a command exits with a non-zero status and print each command before executing it (debugging)
set -ex

# Enable color output
export FORCE_COLOR=1
export NODE_ENV=${NODE_ENV:-production}

# The host for the database, read from an environment variable.
# We'll set this to 'db' in the docker-compose.yml file.
DB_HOST=${DATABASE_HOST:-db}
DB_PORT=${DATABASE_PORT:-5432}

# If DATABASE_URL isn't set (some deploys set DB_* vars only), build it here
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DB_HOST}:${DB_PORT}/${POSTGRES_DB}?schema=${DB_SCHEMA:-public}"
  echo "[ENTRYPOINT] Built DATABASE_URL from components"
fi

# If SHADOW_DATABASE_URL isn't set, build a shadow DB url next to the main DB
if [ -z "$SHADOW_DATABASE_URL" ]; then
  export SHADOW_DATABASE_URL="postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DB_HOST}:${DB_PORT}/${POSTGRES_DB}_shadow?schema=${DB_SCHEMA:-public}"
  echo "[ENTRYPOINT] Built SHADOW_DATABASE_URL from components"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Starting CodeBuilder application...${NC}"
echo -e "${YELLOW}⏳ Waiting for database at $DB_HOST:$DB_PORT to be ready...${NC}"

# Loop until we can successfully connect to the database port.
# nc (netcat) is a small utility perfect for this.
while ! nc -z $DB_HOST $DB_PORT; do
      sleep 1 # wait for 1 second before trying again
done

echo -e "${GREEN}✅ Database is ready.${NC}"

# Run Prisma migrations.
# 'prisma migrate deploy' is the command intended for production/CI/CD environments.
# It applies pending migrations without generating new ones.
echo -e "${YELLOW}🔄 Running database migrations...${NC}"
echo "[ENTRYPOINT] Working dir: $(pwd)"
echo "[ENTRYPOINT] Prisma schema file: ./prisma/schema.prisma"
echo "[ENTRYPOINT] Environment:"
env | grep -E "(DATABASE|POSTGRES|DB)" || true

# Explicitly pass the schema path to avoid ambiguity and help debugging
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo -e "${GREEN}✅ Migrations complete.${NC}"

echo -e "${BLUE}🚀 Starting NestJS application...${NC}"

# Before executing, if no command is provided, default to production start
if [ "$#" -eq 0 ]; then
  echo "[ENTRYPOINT] No command provided, defaulting to pnpm start:prod"
  set -- pnpm start:prod
fi
# 'exec "$@"' replaces the shell process with the given command,
# ensuring it becomes the main process (PID 1) and receives signals correctly.
exec "$@"

echo -e "${RED}🚀 NestJS Application Process Exited...${NC} $@"
