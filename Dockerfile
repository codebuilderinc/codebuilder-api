
# Stage 1: Build the application
FROM node:24-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package manifests and lockfile
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma


# Install dependencies
RUN pnpm install --unsafe-perm \
      && echo '--- DEBUG: pnpm version ---' \
      && pnpm --version \
      && echo '--- DEBUG: node version ---' \
      && node --version \
      && echo '--- DEBUG: npx version ---' \
      && npx --version \
      && echo '--- DEBUG: prisma version (if installed) ---' \
      && npx prisma --version || true \
      && echo '--- DEBUG: node_modules/.bin contents ---' \
      && ls -l node_modules/.bin || true

# Copy the rest of your application code
COPY . .

# Debug before running prisma generate
RUN echo '--- DEBUG: Running npx prisma generate ---' \
      && npx prisma generate

# Build the application
RUN pnpm build

# Stage 2: Production Image
FROM node:24-alpine

WORKDIR /app

# Install pnpm in the final production image as well
RUN npm install -g pnpm

# Set environment variables for better console output
ENV FORCE_COLOR=1
ENV NODE_ENV=production

# Copy only the necessary production artifacts from the 'builder' stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh .

# Ensure the entrypoint is executable
RUN chmod +x docker-entrypoint.sh

# Expose the NestJS port
EXPOSE 4000

# Run migrations then start
ENTRYPOINT ["./docker-entrypoint.sh"]

# The default command for the entrypoint script: run production build
CMD ["pnpm", "start:prod"]