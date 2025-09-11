import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * ResponseEnvelopeInterceptor
 *
 * Wraps successful JSON responses in a standard envelope when the handler or its
 * method metadata indicates it. Envelope shape:
 * { success: boolean; data?: any; error?: { code: string; message: string; details?: any } }
 *
 * Automatically detects if data already matches { success, data } to avoid double wrapping.
 */
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const handler = context.getHandler();
    const wantsEnvelope = Reflect.getMetadata('cb:envelope', handler);

    if (!wantsEnvelope) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // Avoid wrapping if already in desired form
        if (data && typeof data === 'object' && 'success' in data && ('data' in data || 'error' in data)) {
          return data;
        }

        return {
          success: true,
          data,
        };
      })
    );
  }
}
