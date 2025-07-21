FROM node:24-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /usr/src/app

# Copy only manifest and lockfile first for better caching
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install

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