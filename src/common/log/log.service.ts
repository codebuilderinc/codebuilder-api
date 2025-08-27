import { Inject, Injectable, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';
import { Client as OpenSearchClient } from '@opensearch-project/opensearch';
import { context, trace } from '@opentelemetry/api';
import { ClassDeclaration } from 'typescript';
import winston, { Logger } from 'winston';
import { ElasticsearchTransport, ElasticsearchTransportOptions } from 'winston-elasticsearch';
import * as Transport from 'winston-transport';
import { ConfigService } from '../configs/config.service';
import { ConsoleTransport } from './models/console.transport';
import { LogErrorMeta } from './models/log-error-meta.model';
import { LogMeta } from './models/log-meta.model';

/**
 * Handles logging. Each inquirer (class) requesting the log service gets their own copy
 *
 * @export
 * @class LogService
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LogService {
  /**
   * Winston Logger
   *
   * @private
   * @type {Logger}
   * @memberof LogService
   */
  private logger: Logger;

  /**
   * Inquirer Context
   *
   * @private
   * @type {string}
   * @memberof LogService
   */
  private context: string;

  /**
   * Creates an instance of LogService.
   * @param {ConfigService} configService
   * @param {ClassDeclaration} inquirer
   * @memberof LogService
   */
  constructor(
    private readonly configService: ConfigService,
    @Inject(INQUIRER) private readonly inquirer: ClassDeclaration
  ) {
    const defaultMeta = {
      service: this.configService.get('SERVICE_NAME'),
      release: this.configService.get('SERVICE_VERSION'),
      environment: this.configService.get('SERVICE_ENVIRONMENT'),
    };

    const transports: Array<Transport> = [new ConsoleTransport()];
    if (configService.get('LOG_ELASTICSEARCH_NODE')) {
      transports.push(
        new ElasticsearchTransport({
          client: new OpenSearchClient({
            node: configService.get('LOG_ELASTICSEARCH_NODE'),
          }) as unknown as ElasticsearchTransportOptions['client'],
          bufferLimit: 10_000,
        })
      );
    }

    this.logger = winston.createLogger({
      format: winston.format.json(),
      defaultMeta: this.configService.get('NODE_ENV') === 'production' ? defaultMeta : {},
      transports: transports,
    });

    // Automatically set the context for the logger, if we can infer it via dependency injection
    const inquirerName = this.inquirer?.constructor.name;

    if (inquirerName && inquirerName !== 'LogService') {
      this.setContext(inquirerName);
    }
  }

  setContext(context: string): void {
    this.context = context;
  }

  wrapLog(message: string, meta: LogMeta): [string, object] {
    meta = { ...meta, context: this.context };

    // Open telemetry instrumentation
    const traceSpan = trace.getSpan(context.active());
    if (traceSpan) {
      const spanContext = trace.getSpan(context.active()).spanContext();

      meta = {
        ...meta,
        trace_id: spanContext.traceId,
        span_id: spanContext.spanId,
        trace_flags: `0${spanContext.traceFlags.toString(16)}`,
      };
      traceSpan.addEvent(message);
    }

    return [message, meta];
  }

  debug(message: string, meta: LogMeta = {}): void {
    this.logger.debug(...this.wrapLog(message, meta));
  }

  verbose(message: string, meta: LogMeta = {}): void {
    this.logger.verbose(...this.wrapLog(message, meta));
  }

  info(message: string, meta: LogMeta = {}): void {
    this.logger.info(...this.wrapLog(message, meta));
  }

  warn(message: string, meta: LogMeta = {}): void {
    this.logger.warn(...this.wrapLog(message, meta));
  }

  error(message: string, meta: LogErrorMeta): void {
    this.logger.error(...this.wrapLog(message, meta));
  }

  /**
   * FOR NEST CORE INTERNALS ONLY. DO NOT USE
   *
   * @param {string} message
   * @memberof LogService
   */
  log(message: string): void {
    if (!this.context) {
      this.logger.info(message);
    } else {
      throw new Error(`DO NOT USE THIS, FOR NEST CORE INTERNALS ONLY ${this.context}`);
    }
  }
}
