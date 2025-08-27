import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { JsonWebTokenError } from 'jsonwebtoken';
import { LogService } from './../log/log.service';

@Catch()
export class ExceptionsLoggerFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logService: LogService
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
      errorMessage = 'Internal Server Error',
      error = 'Server Error';

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const exceptionResp: any = exception.getResponse();
      errorMessage = exceptionResp.message;
      error = exception.message;
    } else if (!(exception instanceof JsonWebTokenError)) {
      this.logService.error('Failure in ExceptionsLoggerFilter', {
        errorMessage: (exception as Error).message,
        errorStack: (exception as Error).stack,
      });
    }

    const responseBody = {
      error,
      statusCode: httpStatus,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
