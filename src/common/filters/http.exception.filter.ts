import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Log with HTTP status code for observability
    try {
      const method = request.method;
      const url = (request as any).originalUrl || request.url || request.path;
      this.logger.error(`HTTP ${status} ${method} ${url}`, {
        statusCode: status,
        method,
        path: request.path,
        message: exception.message,
        response: exception.getResponse?.(),
      });
    } catch (_) {
      // no-op: never block response on logging failures
    }

    const payload = exception.getResponse?.();
    response.status(status).json({
      success: false,
      error: {
        statusCode: status,
        message: (payload as any)?.message || exception.message,
        details: payload,
        path: request.path,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
