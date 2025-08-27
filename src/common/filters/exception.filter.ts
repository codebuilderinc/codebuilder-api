import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { logger } from '../../logger/logger';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Log with HTTP status code for observability
    try {
      const method = request.method;
      const url = (request as any).originalUrl || request.url || request.path;
      logger.error(`HTTP ${status} ${method} ${url}`, {
        statusCode: status,
        method,
        path: request.path,
        message: exception.message,
        response: exception.getResponse?.(),
      });
    } catch (_) {
      // no-op: never block response on logging failures
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.path,
      exception: exception.getResponse(),
    });
  }
}
