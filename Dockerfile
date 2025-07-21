# syntax=docker/dockerfile:1
FROM node:24-alpine

# install pnpm globally
RUN npm install -g pnpm

# your working dir in container
WORKDIR /usr/src/app

# copy only manifest and lockfile, install prod deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod

# copy source & build
COPY . .
RUN pnpm build

# ensure entrypoint is executable
RUN chmod +x docker-entrypoint.sh

# expose the NestJS port
EXPOSE 4000

# run migrations then start
ENTRYPOINT ["./docker-entrypoint.sh"]