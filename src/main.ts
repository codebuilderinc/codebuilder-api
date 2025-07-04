import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LogLevel, ValidationPipe } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

/**
 * Resolve log levels from the env var once so we can pass the correct tuple to
 * NestFactory. Defaults to `log`, `error`, and `warn`.
 */
const logLevels: LogLevel[] = (process.env.LOG_LEVEL ?? 'log,error,warn')
  .split(',')
  .map((l) => l.trim() as LogLevel);

async function bootstrap(): Promise<void> {
  /**
   * Create the Nest application with the resolved logger levels.
   * Using the NestExpressApplication generic gives us proper typings for
   * Express‑specific helpers such as `set()`.
   */
  const app = await NestFactory.create(AppModule, {
    logger: logLevels,
  });

  /**
   * Trust the first proxy (e.g. when running behind Nginx).
   * If you have more than one hop, adjust the integer accordingly.
   */
  (app.getHttpAdapter().getInstance() as import('express').Application).set(
    'trust proxy',
    1,
  );

  /**
   * Security / branding headers.
   */
  app.use((_: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Powered-By', 'CodeBuilder API');
    next();
  });

  /**
   * Enable CORS using Nest’s built-in helper. The explicit types on the
   * callback parameters prevent `no-unsafe-member-access` warnings.
   */
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: process.env.CORS_METHODS ?? 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders:
      process.env.CORS_ALLOWED_HEADERS ?? 'Content-Type, Accept, Authorization',
    credentials: true,
  });

  /**
   * Global API prefix & validation pipe.
   */
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  /**
   * Parse port from environment (default 3000). Fail fast if the value is not
   * a valid integer to avoid silent fallbacks.
   */
  const portEnv = process.env.PORT ?? '3000';
  const port = Number.parseInt(portEnv, 10);
  if (Number.isNaN(port)) {
    throw new Error(`PORT environment variable is not a number: "${portEnv}"`);
  }

  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`🚀  CodeBuilder API is listening on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('❌ Error starting application:', error);
  process.exit(1);
});
