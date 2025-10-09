//import { GraphQLModule } from '@nestjs/graphql';
import { Logger, MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from './common/configs/config.module';
import { PrismaModule, loggingMiddleware } from 'nestjs-prisma';
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

//import { AppResolver } from './app.resolver';
//import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
//import { GqlConfigService } from './gql-config.service';
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

@Module({
  imports: [
    SentryModule.forRoot(),
    // Setup NestJS open telemetry auto instrumentation. This requires the configuration
    // to be passed in again for some features (e.g. metrics) to work correctly.
    //OpenTelemetryModule.forRoot(openTelemetryConfig),
    ConfigModule,
    //ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    //LoggerModule,
    //OpenTelemetryModuleConfig,
    RedisModule.forRoot(),
    PrismaModule.forRoot({
      isGlobal: true,
      prismaServiceOptions: {
        middlewares: [
          // configure your prisma middleware
          loggingMiddleware({
            logger: new Logger('PrismaMiddleware'),
            logLevel: 'log',
          }),
        ],
      },
    }),

    // GraphQLModule.forRootAsync<ApolloDriverConfig>({
    //     driver: ApolloDriver,
    //     useClass: GqlConfigService,
    // }),

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
