import { applyDecorators, Type as NestType } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOperationOptions,
  ApiResponseOptions,
  ApiParam,
  ApiQuery,
  getSchemaPath,
} from '@nestjs/swagger';
import { RedisAuthGuard } from '../../auth/redis-auth.guard';

export type ApiDecoratorResponse = ApiResponseOptions;

export interface ApiOptions {
  /** Shorthand for ApiOperation -> summary */
  summary?: string;
  /** Shorthand for ApiOperation -> description */
  description?: string;
  /** Full ApiOperation options (overrides summary/description if provided) */
  apiOperationOptions?: Partial<ApiOperationOptions>;
  /** Explicit list of responses. If provided, default Created/Unauthorized/Forbidden set is suppressed (except Unauthorized when auth required). */
  responses?: ApiDecoratorResponse[];
  /** Backwards compat (deprecated) */
  apiResponses?: Partial<ApiResponseOptions>[];
  /** When true attaches RedisAuthGuard + bearer auth + 401 response (if not explicitly supplied). */
  authenticationRequired?: boolean;
  /** DTO / class for request body */
  bodyType?: NestType<any> | (new (...args: any[]) => any);
  /** Path params */
  params?: Array<{
    name: string;
    description?: string;
    type?: any;
    required?: boolean;
    enum?: any[];
  }>;
  /** Query params */
  queries?: Array<{
    name: string;
    description?: string;
    type?: any;
    required?: boolean;
    enum?: any[];
    example?: any;
  }>;
  /** Derive query params from one or more DTO / classes with Field decorators */
  queriesFrom?: (new (...args: any[]) => any) | Array<new (...args: any[]) => any>;
  /** Derive path params from one or more DTO / classes with Field decorators */
  pathParamsFrom?: (new (...args: any[]) => any) | Array<new (...args: any[]) => any>;
  /** Mark operation deprecated */
  deprecated?: boolean;
  /** Shorthand to specify a single 200 response type */
  responseType?: NestType<any>;
  /** Shorthand to specify an array 200 response type */
  responseArrayType?: NestType<any>;
  /** Shorthand to specify a paginated 200 response type (items + pageInfo) */
  paginatedResponseType?: NestType<any>;
  /** Wrap successful 2xx response in a standard envelope { success, data, error? } */
  envelope?: boolean;
}

export function Api(options: ApiOptions): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    // Attempt body type inference if not supplied
    if (!options.bodyType) {
      try {
        const paramTypes: any[] = Reflect.getMetadata('design:paramtypes', target, propertyKey) || [];
        const inferred = paramTypes.find((t) => {
          if (!t) return false;
          const isPrimitive = [String, Number, Boolean, Array, Object].includes(t);
          return !isPrimitive && /Dto|Input/i.test(t.name || '');
        });
        if (inferred) {
          options.bodyType = inferred;
        }
      } catch {
        /* ignore */
      }
    }

    const op: ApiOperationOptions = {
      summary: options.summary,
      description: options.description,
      deprecated: options.deprecated,
      ...(options.apiOperationOptions || {}),
    } as ApiOperationOptions;

    const userProvidedResponses = (options.responses || options.apiResponses || []).filter((v) =>
      Boolean(v)
    ) as ApiResponseOptions[];
    const addDefaultSet = userProvidedResponses.length === 0; // Only add defaults when no custom responses passed

    const decorators: any[] = [];
    if (options.authenticationRequired) {
      decorators.push(UseGuards(RedisAuthGuard), ApiBearerAuth());
    }
    decorators.push(ApiOperation(op));

    if (options.bodyType) {
      decorators.push(ApiBody({ type: options.bodyType }));
    }

    // Params
    (options.params || []).forEach((p) =>
      decorators.push(
        ApiParam({
          name: p.name,
          description: p.description,
          required: p.required !== false, // default true
          enum: p.enum,
          type: p.type,
        })
      )
    );

    // Auto path params from metadata
    if (options.pathParamsFrom) {
      const sources = Array.isArray(options.pathParamsFrom) ? options.pathParamsFrom : [options.pathParamsFrom];
      sources.forEach((src) => {
        if (!src) return;
        const meta = Reflect.getMetadata('cb:fieldMeta', src.prototype) || [];
        meta
          .filter((m: any) => m.inPath)
          .forEach((m: any) =>
            decorators.push(
              ApiParam({
                name: m.name,
                description: m.description,
                required: m.required,
                enum: m.enum,
                type: m.type,
              })
            )
          );
      });
    }

    // Queries
    (options.queries || []).forEach((q) =>
      decorators.push(
        ApiQuery({
          name: q.name,
          description: q.description,
          required: q.required === true, // default false
          enum: q.enum,
          type: q.type,
          example: q.example,
        })
      )
    );

    if (options.queriesFrom) {
      const sources = Array.isArray(options.queriesFrom) ? options.queriesFrom : [options.queriesFrom];
      sources.forEach((src) => {
        if (!src) return;
        const qMeta = Reflect.getMetadata('cb:fieldMeta', src.prototype) || [];
        qMeta
          .filter((m: any) => m.inQuery)
          .forEach((m: any) =>
            decorators.push(
              ApiQuery({
                name: m.name,
                description: m.description,
                required: m.required === true,
                enum: m.enum,
                type: m.type,
              })
            )
          );
      });
    }

    // Shorthand 200 response helpers (only if user didn't explicitly define 200)
    const hasExplicit200 = userProvidedResponses.some((r) => r.status === 200);
    if (!hasExplicit200) {
      if (options.responseType) {
        if (options.envelope) {
          decorators.push(
            ApiResponse({
              status: 200,
              description: 'Successful response',
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: getSchemaPath(options.responseType) },
                },
              },
            })
          );
        } else {
          decorators.push(ApiResponse({ status: 200, description: 'Successful response', type: options.responseType }));
        }
      } else if (options.responseArrayType) {
        const arraySchema = {
          type: 'array',
          items: { $ref: getSchemaPath(options.responseArrayType) },
        };
        if (options.envelope) {
          decorators.push(
            ApiResponse({
              status: 200,
              description: 'Successful response',
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: arraySchema,
                },
              },
            })
          );
        } else {
          decorators.push(
            ApiResponse({
              status: 200,
              description: 'Successful response',
              schema: arraySchema,
            })
          );
        }
      } else if (options.paginatedResponseType) {
        const basePaginated = {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { $ref: getSchemaPath(options.paginatedResponseType) },
            },
            pageInfo: {
              type: 'object',
              properties: {
                hasNextPage: { type: 'boolean' },
                hasPreviousPage: { type: 'boolean' },
                startCursor: { type: 'string', nullable: true },
                endCursor: { type: 'string', nullable: true },
              },
            },
            totalCount: { type: 'number' },
            meta: {
              type: 'object',
              additionalProperties: true,
              nullable: true,
              description: 'Optional metadata related to this collection (e.g., company, tag, filters)',
            },
          },
        };
        if (options.envelope) {
          decorators.push(
            ApiResponse({
              status: 200,
              description: 'Successful response',
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: basePaginated,
                },
              },
            })
          );
        } else {
          decorators.push(
            ApiResponse({
              status: 200,
              description: 'Successful response',
              schema: basePaginated,
            })
          );
        }
      }
    }

    if (addDefaultSet) {
      decorators.push(ApiUnauthorizedResponse({ description: 'Unauthorized' }));
      decorators.push(ApiCreatedResponse({ description: 'The record has been successfully created.' }));
      decorators.push(ApiForbiddenResponse({ description: 'Forbidden.' }));
    } else {
      let has401 = userProvidedResponses.some((r) => r.status === 401);
      if (options.authenticationRequired && !has401) {
        decorators.push(ApiUnauthorizedResponse({ description: 'Unauthorized' }));
        has401 = true;
      }
    }

    if (userProvidedResponses.length > 0) {
      userProvidedResponses.forEach((r) => decorators.push(ApiResponse(r)));
    }

    // Store envelope intention for interceptor usage
    if (options.envelope) {
      try {
        Reflect.defineMetadata('cb:envelope', true, descriptor.value);
      } catch {
        /* ignore */
      }
    }

    applyDecorators(...decorators)(target, propertyKey, descriptor);
  };
}
