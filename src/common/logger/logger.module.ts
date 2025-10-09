import { Module, MiddlewareConsumer, RequestMethod, NestModule } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { requestLoggingMiddleware } from './middleware';

@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class CommonLoggerModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(requestLoggingMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.ALL },
        { path: 'favicon.ico', method: RequestMethod.ALL },
        { path: 'robots.txt', method: RequestMethod.ALL },
        { path: 'apple-touch-icon.png', method: RequestMethod.ALL },
        { path: 'apple-touch-icon-precomposed.png', method: RequestMethod.ALL },
        { path: 'favicon-16x16.png', method: RequestMethod.ALL },
        { path: 'favicon-32x32.png', method: RequestMethod.ALL },
        { path: 'site.webmanifest', method: RequestMethod.ALL },
        { path: 'sitemap.xml', method: RequestMethod.ALL }
      )
      .forRoutes('*');
  }
}
