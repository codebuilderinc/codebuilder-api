import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from 'src/common/models/api-response.model';
import { PaginatedResponse } from 'src/common/models/paginated-response.model';
import { TraceService } from './../../trace/trace.service';
import { PaginationQuery } from './pagination-query.model';

@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  constructor(private readonly traceService: TraceService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse | PaginatedResponse> {
    const span = this.traceService.startSpanRaw(
      'Interceptor->Controller->PaginationInterceptor.intercept (pre-controller)'
    );
    const request = context.switchToHttp().getRequest();

    request.query = {
      ...request.query,
      pageSize: Math.min(request.query.pageSize || 50, 50),
    };

    // Here we request one more than they asked for to see if we have another page
    request.query.pagination = {
      take: request.query.pageSize + 1,
      skip: (request.query.page ?? 0) * request.query.pageSize,
      cursor: request.query.cursor ?? undefined,
    } as PaginationQuery;

    span.end();

    return next.handle().pipe(
      map((response) => {
        const span = this.traceService.startSpanRaw(
          'Interceptor->Controller->PaginationInterceptor.intercept (post-request)'
        );

        if (!Array.isArray(response)) {
          span.end();
          return { response };
        }

        // Here we return pageSize because we added an extra earlier
        const resultsLength = response.length > request.query.pageSize + 1 ? response.length : request.query.pageSize;
        const results = (response || []).slice(0, resultsLength);

        span.end();
        return {
          results,
          hasNextPage: response.length > request.query.pageSize,
        };
      })
    );
  }
}
