# Ensure devDependencies are installed for build
# Install pnpm if not present, then install all dependencies including devDependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install

# Build the app (nest CLI will be available)
RUN pnpm build
# syntax=docker/dockerfile:1
FROM node:24-alpine

# install pnpm globally
RUN npm install -g pnpm

# your working dir in container
WORKDIR /usr/src/app


# copy only manifest and lockfile, install all deps (including devDependencies)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# copy source & build
COPY . .
RUN pnpm build

# prune devDependencies for smaller final image
RUN pnpm prune --prod

# ensure entrypoint is executable
RUN chmod +x docker-entrypoint.sh

# expose the NestJS port
EXPOSE 4000

# run migrations then start
ENTRYPOINT ["./docker-entrypoint.sh"]