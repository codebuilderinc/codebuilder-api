# Copilot Instructions for codebuilder-api

## Project Overview

This is **codebuilder-api**, a NestJS backend API built with TypeScript. It uses Prisma as the ORM (schema maintained in a Git submodule at `prisma/`), Redis for caching and queues, PostgreSQL for the database, and is deployed via Docker.

## Tech Stack

- **Runtime:** Node.js v22 with pnpm as the package manager
- **Framework:** NestJS 11 with Express adapter
- **Language:** TypeScript (ES2023 target, ESNext modules, bundler resolution)
- **ORM:** Prisma with auto-generated DTOs via `@vegardit/prisma-generator-nestjs-dto`
- **Build:** SWC compiler (configured in `nest-cli.json`)
- **Testing:** Jest with ts-jest; E2E tests use Supertest
- **Linting:** ESLint (flat config) with TypeScript-ESLint and Prettier integration
- **Formatting:** Prettier (140 print width, single quotes, trailing commas ES5, 2-space indent)

## Project Structure

```
src/
├── auth/            # Authentication (JWT, Google OAuth)
├── cloudflare-kv/   # Cloudflare KV integration
├── common/          # Shared infrastructure
│   ├── configs/     # Configuration service
│   ├── database/    # Prisma database module
│   ├── decorators/  # Custom decorators (@Api, @User, @Field)
│   ├── filters/     # Exception filters
│   ├── helpers/     # Utility functions
│   ├── interceptors/# Response interceptors
│   ├── logger/      # Logging service
│   ├── models/      # Common response models
│   ├── pagination/  # Pagination utilities
│   ├── queue/       # BullMQ job queue
│   ├── redis/       # Redis module and providers
│   └── validation/  # Custom validators
├── errors/          # Error reporting
├── events/          # WebSocket events gateway
├── generated/       # Auto-generated Prisma DTOs (do not edit)
├── jobs/            # Job management
├── location/        # Location services
├── notifications/   # Push notifications (Firebase)
├── users/           # User management
└── wss/             # WebSocket support
```

## Coding Conventions

### File Naming

- Controllers: `{name}.controller.ts`
- Services: `{name}.service.ts`
- Modules: `{name}.module.ts`
- DTOs: `{operation}-{entity}.dto.ts` (e.g., `create-job.dto.ts`)
- Filters: `{name}.filter.ts`
- Guards: `{name}.guard.ts`
- Interceptors: `{name}.interceptor.ts`
- Decorators: `{name}.decorator.ts`

### Imports

Use the `@/` path alias for imports from the `src/` directory:

```typescript
import { Api } from '@/common/decorators/api.decorator';
import { NotificationsService } from '@/notifications/notifications.service';
```

### API Patterns

- Use the custom `@Api()` decorator for controller methods to configure Swagger docs, response types, and the response envelope.
- Endpoints using `@Api({ envelope: true })` return `{ "success": true, "data": <payload> }`.
- Paginated endpoints use `paginatedResponseType` and return items with `pageInfo` metadata. Use `buildPaginatedResult()` in services.
- DTO properties use `@Field({ inQuery: true })` or `@Field({ inPath: true })` for automatic Swagger parameter generation.
- Throw standard NestJS `HttpException` subclasses for error handling.

### Validation

- Use `class-validator` and `class-transformer` decorators on DTOs for input validation.
- The global `ValidationPipe` is configured with `whitelist: true` and `transform: true`.

## Important Notes

- **Do not edit files in `src/generated/`** — these are auto-generated from the Prisma schema using `npx prisma generate`.
- **The Prisma schema is a Git submodule** at `prisma/`. Schema changes should be made in the `codebuilderinc/codebuilder-prisma` repository.
- The project uses Prettier for formatting; run `pnpm format` to format code or `pnpm lint` to lint and auto-fix.

## Common Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Build the project
pnpm dev              # Start in development/watch mode (NODE_ENV=local)
pnpm lint             # Lint and auto-fix
pnpm format           # Format code with Prettier
pnpm test             # Run unit tests
pnpm test:e2e         # Run end-to-end tests
```
