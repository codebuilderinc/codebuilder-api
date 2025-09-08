import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { Counter } from '@opentelemetry/api-metrics';
import { Prisma, PrismaClient, PrismaPromise } from '@prisma/client';
import { ConfigService } from '../configs/config.service';
import { LogService } from '../log/log.service';
import { TraceService } from '../trace/trace.service';
import { logger } from '../../logger/logger';
// Alternatively, if the above does not work
// import { PrismaClient } from '../../node_modules/@prisma/client/dist/index';
// No replacement needed, just remove this line
//import { PrismaClient as PostgresPrismaClient, Prisma, PrismaPromise } from '@prisma/postgres/client';
export { default as DatabaseModel } from '@prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  //private readonly queriesCounter: Counter;
  //private readonly pendingQueriesCounter: UpDownCounter;

  constructor(
    private readonly logService: LogService,
    private readonly configService: ConfigService,
    private readonly traceService: TraceService //private readonly meter,
  ) {
    super({
      datasources: {
        db: {
          url: configService.get('DATABASE_URL'),
        },
      },
      // log: [
      //   {
      //     emit: 'stdout',
      //     level: 'query',
      //   },
      // ]
    });
    logger.info(`Using Prisma v${Prisma.prismaVersion.client} ${configService.get('DATABASE_URL')}`);

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
    this.$use(async (params: any, next) => {
      const span = this.traceService.startSpan(`prisma: ${params.model}.${params.action}`);
      //this.queriesCounter.add(1);
      // this.pendingQueriesCounter.add(1);
      const result = await next(params);
      span.end();

      // this.pendingQueriesCounter.add(-1);

      return result;
    });

    const prismaEngine = (this as any)._engineConfig;

    await (this as any).$connect();

    this.logService.info(
      `Connected to ${prismaEngine.activeProvider} instance using Prisma v${prismaEngine.clientVersion} ${this.configService.get('DATABASE_URL')}`
    );

    // Enable this when you really need to see the SQL / params
    // this.$on('query' as any, (e) => {
    //   console.log(e)
    // })

    //   console.log(e)
    // })
  }

  async transaction<P extends PrismaPromise<any>[]>(arg: [...P]) {
    const span = this.traceService.startSpan('$transaction');
    const result = await super.$transaction(arg);
    span.end();

    return result;
  }

  async onModuleDestroy(): Promise<void> {
    await super.$disconnect();

    this.logService.debug('Disconnected from Postgres instance');
  }
}
