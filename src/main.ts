import './instrument';

//
// ===================================
// NestJS Application Bootstrap
// ===================================
//
import 'reflect-metadata';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, LogLevel, ValidationPipe } from '@nestjs/common';
import { ConfigService } from './common/configs/config.service'; // Assuming path to your ConfigService
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaClientExceptionFilter } from 'nestjs-prisma';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HttpExceptionFilter } from './common/filters/http.exception.filter';
import { ExceptionsLoggerFilter } from './common/filters/exception.filter';
import { LoggerService } from './common/logger/logger.service';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';

import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'body-parser';

/**
 * BigInt JSON serialization polyfill.
 * This is required for class-validator to handle BigInt types correctly. Do not remove.
 */
(BigInt.prototype as any).toJSON = function () {
  return parseInt(this.toString());
};

/**
 * Resolve log levels from the environment variables. Defaults to log, error, and warn.
 */
const logLevels: LogLevel[] = (process.env.LOG_LEVEL ?? 'log,error,warn')
  .split(',')
  .map((level) => level.trim() as LogLevel);

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: logLevels,
    bodyParser: false, // We are using the body-parser middleware directly for more control
  });

  // Enable graceful shutdown hooks.
  app.enableShutdownHooks();

  // Get services from the DI container.
  const configService = app.get(ConfigService);
  const nestConfig = configService.get('nest');
  const swaggerConfig = configService.get('swagger');

  // ===================================
  // Middleware
  // ===================================
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
  app.use(cookieParser());
  app.use(helmet({ contentSecurityPolicy: false })); // Adjust CSP as needed for your application

  // Trust the first proxy (e.g., when running behind Nginx or a load balancer).
  app.set('trust proxy', 1);

  // Set a custom X-Powered-By header for branding/security.
  app.use((_req, res, next) => {
    res.setHeader('X-Powered-By', 'CodeBuilder API');
    next();
  });

  // ===================================
  // CORS
  // ===================================
  // Using Nest's built-in helper with configuration from environment variables.
  // For more complex logic, you could re-introduce your `cors_options_delegate`.
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: process.env.CORS_METHODS ?? 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: process.env.CORS_ALLOWED_HEADERS ?? 'Content-Type, Accept, Authorization',
    credentials: true,
  });

  // Support requests without the `/api` prefix by adding it automatically.
  // Routes are registered under /api/* via RouterModule, so this lets both
  // `/jobs` and `/api/jobs` work without changing controllers.
  // NOTE: We exclude Swagger paths from rewriting.
  const swaggerPath = swaggerConfig.path || 'api';
  app.use((req: any, _res, next) => {
    if (typeof req.url === 'string') {
      const urlPath = req.url.split('?')[0];

      // Skip if already has /api prefix
      if (req.url.startsWith('/api')) {
        return next();
      }

      // Skip root path, health checks, and other special paths
      if (urlPath === '/' || urlPath === '/health') {
        return next();
      }

      // Add /api prefix to the request
      const newUrl = `/api${req.url}`;
      req.url = newUrl;
      req.originalUrl = newUrl;
    }
    next();
  });

  // ===================================
  // Global Setup
  // ===================================
  //app.setGlobalPrefix('api');

  // Global pipes for input validation and transformation.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip away properties that do not have any decorators
      transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
      skipMissingProperties: true, // Allow skipping validation for missing properties
      exceptionFactory: (errors) => {
        // You can customize the error response here if needed.
        return new BadRequestException(errors);
      },
    })
  );

  // Global filters for exception handling.
  const { httpAdapter } = app.get(HttpAdapterHost);
  const logger = app.get(LoggerService);
  app.useGlobalFilters(
    new ExceptionsLoggerFilter(app.get(HttpAdapterHost), logger),
    new HttpExceptionFilter(logger),
    new PrismaClientExceptionFilter(httpAdapter)
  );
  // Global interceptor for standardized response envelopes (only wraps endpoints marked with envelope flag)
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

  // ===================================
  // WebSocket Adapter (Optional)
  // ===================================
  // Uncomment these lines to use the Redis adapter for WebSockets.
  // import { CustomRedisIoAdapter } from './wss/wss.adapter'; // Adjust path
  // import Redis from 'ioredis';
  // import { REDIS_PUBLISHER_CLIENT, REDIS_SUBSCRIBER_CLIENT } from './redis/redis.constants'; // Adjust path
  // const pubClient: Redis = app.get(REDIS_PUBLISHER_CLIENT);
  // const subClient: Redis = app.get(REDIS_SUBSCRIBER_CLIENT);
  // app.useWebSocketAdapter(new CustomRedisIoAdapter(app, subClient, pubClient));

  // ===================================
  // Swagger API Documentation
  // ===================================
  if (swaggerConfig.enabled) {
    const options = new DocumentBuilder()
      .setTitle(swaggerConfig.title || 'CodeBuilder API')
      .setDescription(swaggerConfig.description || 'API documentation for CodeBuilder')
      .setVersion(swaggerConfig.version || '1.0')
      .addBearerAuth() // If you use Bearer token authentication
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup(swaggerConfig.path || 'api/docs', app, document);
  }

  // ===================================
  // Start Application
  // ===================================
  const portEnv = process.env.PORT ?? nestConfig.port ?? '3000';
  const port = Number.parseInt(String(portEnv), 10);
  console.log(`🛫 CodeBuilder API app taking off listening on http://localhost:${port}`);

  if (Number.isNaN(port)) {
    throw new Error(`PORT environment variable is not a valid number: "${portEnv}"`);
  }

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 CodeBuilder API is listening on http://localhost:${port}`);
  if (swaggerConfig.enabled) {
    console.log(`📚 Swagger Docs available at http://localhost:${port}/${swaggerConfig.path || 'api/docs'}`);
  }
}

// Start the bootstrap process and handle any fatal errors.
bootstrap().catch((error) => {
  console.error('❌ Error starting NestJS application:', error);
  // At this point, OpenTelemetry might already be trying to shut down via SIGTERM handler.
  // Forcing exit after a delay ensures logs are flushed.
  setTimeout(() => process.exit(1), 1000);
});
