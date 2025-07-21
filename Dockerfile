FROM node:24-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /usr/src/app


# Copy only manifest, lockfile, and prisma schema for better caching
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma


# Install all dependencies (including devDependencies for build)
RUN pnpm install --unsafe-perm

# Generate Prisma Client
RUN pnpm prisma generate

# Copy the rest of the source code
COPY . .

# Build the app (requires @nestjs/cli as devDependency)
RUN pnpm build

# Prune devDependencies for smaller final image
RUN pnpm prune --prod

# Ensure entrypoint is executable
RUN chmod +x docker-entrypoint.sh

# Expose the NestJS port
EXPOSE 4000

# Run migrations then start
ENTRYPOINT ["./docker-entrypoint.sh"]