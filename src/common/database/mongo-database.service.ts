import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { Counter } from '@opentelemetry/api';
import { ConfigService } from './../configs/config.service';
import { LoggerService } from '../logger/logger.service';
import { TraceService } from './../trace/trace.service';
//export { default as DatabaseModel, Prisma as DatabaseClause, Prisma, PrismaClient, PrismaPromise } from '@prisma/client';
import { PrismaClient as MongoPrismaClient, Prisma, PrismaPromise } from '@prisma/client';

@Injectable()
export class MongoDatabaseService extends MongoPrismaClient implements OnModuleInit, OnModuleDestroy {
  //private readonly queriesCounter: Counter;
  //private readonly pendingQueriesCounter: UpDownCounter;

  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly traceService: TraceService //private readonly meter,
  ) {
    super({
      datasources: {
        db: {
          url: configService.get('MONGO_DATABASE_URL'),
        },
      },

      // Enable this when you really need to see the SQL / params
      //  log: [
      //   {
      //     emit: 'stdout',
      //     level: 'query',
      //   },
      // ],
    });

    /* this.meter = meterProvider.getMeter('example-exporter-collector');

    this.queriesCounter = this.meter.createCounter('databaseservice_queries', {
      description: 'Amount of executed database queries',
    });

    this.pendingQueriesCounter = this.meter.createUpDownCounter(
      'databaseservice_pending_queries',
      {
        description: 'Amount of database queries currently in flight',
      },
    );*/
  }

  async onModuleInit(): Promise<void> {
    const prismaEngine = (this as any)._engineConfig;

    await this.$connect();

    this.logger.info(
      `Connected to ${prismaEngine.activeProvider} instance using Prisma v${prismaEngine.clientVersion}`
    );

    // Enable this when you really need to see the SQL / params
    // this.$on('query' as any, (e) => {
    //   console.log(e)
    // })

    this.$use(async (params: Prisma.MiddlewareParams, next) => {
      //this.queriesCounter.add(1);
      // this.pendingQueriesCounter.add(1);

      const span = this.traceService.startSpan('$query');
      span.setAttributes({ model: params.model, action: params.action });
      const result = await next(params);
      span.end();

      // this.pendingQueriesCounter.add(-1);

      return result;
    });
  }

  async transaction<P extends PrismaPromise<any>[]>(arg: [...P]) {
    const span = this.traceService.startSpan('$transaction');
    const result = await super.$transaction(arg);
    span.end();

    return result;
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();

    this.logger.debug('Disconnected from Mongo instance');
  }
}
