import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Counter } from '@opentelemetry/api';
//import { Meter } from '@opentelemetry/sdk-metrics-base';
import { ConnectionOptions, Job as BullJob, JobsOptions, Queue, RedisClient } from 'bullmq';
import { ConfigService } from '../configs/config.service';
import { LoggerService } from '../logger/logger.service';
import { TraceService } from '../trace/trace.service';
import { JobNames } from './models/job-names.enum';
import { QueueNames } from './models/queue-names.enum';

export type Job<T = any> = BullJob<T>;
export type JobConsumer<T = unknown> = (job: Job<T>) => Promise<void>;

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private queueNames: string[] = Object.values(QueueNames);
  private bullQueues: Record<string, Queue> = {};
  private queueConnection: ConnectionOptions;
  private readonly queuedJobsCounter: Counter;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly traceService: TraceService //private readonly meter: Meter,
  ) {
    // Default no-op counter to prevent runtime errors when metrics are not configured.
    this.queuedJobsCounter = { add: () => undefined } as unknown as Counter;

    /*this.queuedJobsCounter = this.meter.createCounter(
      'queueservice_queued_jobs',
      {
        description: 'Amount of queued jobs',
      },
    );*/
  }

  /**
   * Initiate connection to redis through BullMQ / io Redis
   *
   * @returns {Promise<void>}
   * @memberof QueueService
   */
  async onModuleInit(): Promise<void> {
    try {
      this.queueConnection = {
        host: this.configService.get('QUEUE_REDIS_HOST'),
        password: this.configService.get('QUEUE_REDIS_PASSWORD'),
        port: this.configService.get('QUEUE_REDIS_PORT'),
        connectTimeout: 30000,
      };

      if (this.configService.get('QUEUE_REDIS_USE_TLS')) {
        this.queueConnection['tls'] = {};
      }

      /*
       * Create:
       * Queue
       *
       * For each queue defined in QUEUE_NAMES
       */
      await Promise.all(
        this.queueNames.map(async (queueName) => {
          this.bullQueues[queueName] = new Queue(queueName, {
            connection: this.queueConnection,
            defaultJobOptions: {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: this.configService.get('QUEUE_RETRY_INTERVAL'),
              },
            },
          });

          const client: RedisClient = await this.bullQueues[queueName].client;
          client.on('error', (error) => this.onConnectionError(error));
        })
      );

      this.logger.info('Connected to Redis');
    } catch (error) {
      this.onConnectionError(error);
    }
  }

  /**
   * When app starts to shutdown disconnect from redis
   *
   * @returns {Promise<void>}
   * @memberof QueueService
   */
  async onModuleDestroy(): Promise<void> {
    if (!Object.keys(this.bullQueues).length) {
      return;
    }

    for (const queue of Object.keys(this.bullQueues)) {
      await this.bullQueues[queue].disconnect();
    }

    this.logger.debug('Disconnected from Redis instance');
  }

  /**
   * If a connection failure occurs, SIGTERM the container
   *
   * @private
   * @param {unknown} error
   * @memberof QueueService
   */
  private onConnectionError(error: unknown): void {
    const err = error instanceof Error ? error : new Error(this.stringifyUnknownError(error));

    this.logger.error('Connection error', {
      errorMessage: err.message,
      errorStack: err.stack,
    });
  }

  private stringifyUnknownError(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error === null) {
      return 'null';
    }

    if (error && typeof error === 'object') {
      if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
        return (error as { message: string }).message;
      }

      try {
        return JSON.stringify(error);
      } catch {
        return Object.prototype.toString.call(error);
      }
    }

    switch (typeof error) {
      case 'undefined':
        return 'undefined';
      case 'number':
      case 'boolean':
      case 'bigint':
        return String(error);
      case 'symbol':
        return error.toString();
      case 'function':
        return error.name ? `[Function: ${error.name}]` : '[Function]';
      default:
        return 'Unknown error';
    }
  }

  async queue<T>(queueName: string, jobName: JobNames, data?: T, options?: JobsOptions): Promise<Job<T>> {
    // this.queuedJobsCounter.add(1);

    const span = this.traceService.startSpan('queue');

    const job = await this.bullQueues[queueName].add(jobName, data, {
      removeOnComplete: true,
      removeOnFail: true,
      ...options,
    });

    span.setAttributes({ id: job.id, name: job.name });
    this.logger.info('Queued job', { id: job.id, name: job.name });
    span.end();

    return job;
  }

  async bulkQueue<T extends { jobId?: string }>(
    queueName: string,
    jobName: JobNames,
    data: T[] = [],
    options?: JobsOptions
  ): Promise<Job<T>[]> {
    this.queuedJobsCounter.add(data.length);

    const span = this.traceService.startSpan('bulkQueue');

    const jobsPayload = data.map((job: T) => ({
      name: jobName,
      data: job,
      opts: {
        removeOnComplete: true,
        removeOnFail: true,
        jobId: job.jobId,
        ...options,
      },
    }));

    const jobs = await this.bullQueues[queueName].addBulk(jobsPayload);

    const logJobs = jobs.map((job) => ({ id: job.id, name: job.name }));
    this.logger.info('Queued jobs', {
      jobs: logJobs.length,
      jobsSamples: JSON.stringify(logJobs.slice(0, 100)),
    });
    span.end();

    return jobs;
  }
}
