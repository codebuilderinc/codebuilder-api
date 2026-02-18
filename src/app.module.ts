import { Logger, MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'nestjs-prisma';
import { AppService } from './app.service';
//import config from './common/configs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppRouterModule } from './app-router.module';
import { CloudflareKvModule } from './cloudflare-kv/cloudflare-kv.module';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './common/database/database.module';
import { QueueModule } from './common/queue/queue.module';
import { WssModule } from './wss/wss.module';
import { EventsModule } from './events/events.module';
//import { LoggerModule } from './logger/logger.module';
import { RedisModule } from './common/redis/redis.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LocationModule } from './location/location.module';
import { ErrorsModule } from './errors/errors.module';
import { SentryModule } from '@sentry/nestjs/setup';

//import { OpenTelemetryModule } from 'nestjs-otel';
//import { ConfigModule } from '@nestjs/config';
// import { UserModule } from './users/user.module';

// import { AllowedBlockchainsGuard } from './blockchains/allowed-blockchains.guard';
//import { OpenTelemetryModule } from '@metinseylan/nestjs-opentelemetry';
//import { RedisModule } from './redis/redis.module';
//import { openTelemetryConfig } from './open-telemetry.config';
// import { TradeModule } from './trades/trade.module';

// const OpenTelemetryModuleConfig = OpenTelemetryModule.forRoot({
//   metrics: {
//     hostMetrics: true,
//     apiMetrics: {
//       enable: true,
//     },
//   },
// });
console.log('DEBUG ENVIRONMENT:', process.env.NODE_ENV);

@Module({
  imports: [
    SentryModule.forRoot(),
    // Setup NestJS open telemetry auto instrumentation. This requires the configuration
    // to be passed in again for some features (e.g. metrics) to work correctly.
    //OpenTelemetryModule.forRoot(openTelemetryConfig),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'local' ? '.env.local' : '.env',
    }),
    //ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    //LoggerModule,
    //OpenTelemetryModuleConfig,
    RedisModule.forRoot(),
    // Configure Prisma v7: prefer installed adapter, then accelerateUrl env.
    PrismaModule.forRoot({
      isGlobal: true,
      prismaServiceOptions: {
        middlewares: [
          // configure your prisma middleware (inline implementation)
          (params, next) => {
            const logger = new Logger('PrismaMiddleware');
            const start = Date.now();
            return next(params).then((result) => {
              const duration = Date.now() - start;
              logger.log(`${params?.model ?? 'Unknown'}.${params?.action} took ${duration}ms`);
              return result;
            });
          },
        ],
      } as any,
    }),

    AppRouterModule,
    CloudflareKvModule,
    CommonModule,
    DatabaseModule,
    //UserModule,
    QueueModule,
    EventsModule,
    //RedisModule,

    WssModule,
    NotificationsModule,
    LocationModule,
    ErrorsModule,
  ],
  providers: [],
})
export class AppModule {
  public configure(consumer: MiddlewareConsumer): void | MiddlewareConsumer {}
}
