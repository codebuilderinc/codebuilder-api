//
// ===================================
// OpenTelemetry Initialization
// ===================================
//
// The OpenTelemetry SDK must be initialized BEFORE any other modules are imported.
// This ensures that instrumentation can correctly patch the necessary libraries
// and capture telemetry from the very beginning of the application's lifecycle.
//
import { NodeSDK } from '@opentelemetry/sdk-node';

// DEBUG: Print REDIS_SERVERS and all env vars at startup
console.log('DEBUG: REDIS_SERVERS env:', process.env.REDIS_SERVERS);
console.log('DEBUG: All environment variables:', JSON.stringify(process.env, null, 2));
//import openTelemetryConfig from './open-telemetry.config.json'; // Assuming this config file exists in your new project

// const openTelemetry = new NodeSDK(openTelemetryConfig);

// try {
//     openTelemetry.start();
//     console.log('✅ OpenTelemetry SDK started successfully.');
// } catch (error) {
//     console.error('❌ Could not start OpenTelemetry SDK:', error);
//     process.exit(1);
// }

// // Gracefully shut down the OpenTelemetry SDK on process exit.
// process.on('SIGTERM', () => {
//     openTelemetry
//         .shutdown()
//         .then(() => console.log('➡️ OpenTelemetry tracing terminated.'))
//         .catch((error) => console.error('Error terminating OpenTelemetry tracing:', error))
//         .finally(() => process.exit(0));
// });

//
// ===================================
// NestJS Application Bootstrap
// ===================================
//
// All other imports are placed here, after the OpenTelemetry SDK has been started.
//
import 'reflect-metadata';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, LogLevel, ValidationPipe } from '@nestjs/common';
import { ConfigService } from './common/configs/config.service'; // Assuming path to your ConfigService
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaClientExceptionFilter } from 'nestjs-prisma';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HttpExceptionFilter } from './common/filters/exception.filter'; // Assuming path to your filter

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
const logLevels: LogLevel[] = (process.env.LOG_LEVEL ?? 'log,error,warn').split(',').map((level) => level.trim() as LogLevel);

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

    // ===================================
    // Global Setup
    // ===================================
    app.setGlobalPrefix('api');

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
    app.useGlobalFilters(new HttpExceptionFilter(), new PrismaClientExceptionFilter(httpAdapter));

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
