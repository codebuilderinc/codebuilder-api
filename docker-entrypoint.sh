#!/usr/bin/env sh
#
# Entrypoint for NestJS container.
# - waits for the database
# - runs migrations
# - starts the app

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

export FORCE_COLOR=1
export NODE_ENV=${NODE_ENV:-production}

DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}

echo -e "${BLUE}🐳 Starting NestJS application...${NC}"
echo -e "${YELLOW}⏳ Waiting for database at ${DB_HOST}:${DB_PORT}...${NC}"

# Wait until the DB port is open
while ! nc -z $DB_HOST $DB_PORT; do
      sleep 1
done

echo -e "${GREEN}✅ Database is ready.${NC}"
echo -e "${YELLOW}🔄 Running database migrations...${NC}"

# run migrations (adjust script name if needed)
pnpm run migration:run

echo -e "${GREEN}✅ Migrations complete.${NC}"
echo -e "${BLUE}🚀 Launching NestJS (prod)...${NC}"

# Replace this shell with the main process (PID 1)
exec node dist/main.js
