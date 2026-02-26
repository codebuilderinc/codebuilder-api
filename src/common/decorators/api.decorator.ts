import {applyDecorators, Type as NestType} from '@nestjs/common';
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
//import { RedisAuthGuard } from '../../auth/redis-auth.guard';

/**
 * API Decorator Response Type
 * Alias for Swagger's ApiResponseOptions to simplify type usage
 */
export type ApiDecoratorResponse = ApiResponseOptions;

/**
 * API Decorator Options Interface
 *
 * This interface defines all available options for the @Api() decorator,
 * which provides a unified way to configure Swagger documentation for NestJS endpoints.
 *
 * @example
 * ```typescript
 * @Api({
 *   summary: 'Get all users',
 *   description: 'Returns a paginated list of users',
 *   paginatedResponseType: UserDto,
 *   queriesFrom: [PaginationArgs, UserFilterDto],
 *   authenticationRequired: true,
 *   envelope: true
 * })
 * ```
 */
export interface ApiOptions {
  /** Shorthand for ApiOperation -> summary */
  summary?: string;

  /** Shorthand for ApiOperation -> description */
  description?: string;

  /** Full ApiOperation options (overrides summary/description if provided) */
  apiOperationOptions?: Partial<ApiOperationOptions>;

  /** Explicit list of responses. If provided, default Created/Unauthorized/Forbidden set is suppressed (except Unauthorized when auth required). */
  responses?: ApiDecoratorResponse[];

  /** @deprecated Backwards compatibility - use 'responses' instead */
  apiResponses?: Partial<ApiResponseOptions>[];

  /** When true, attaches RedisAuthGuard + bearer auth + 401 response (if not explicitly supplied). */
  authenticationRequired?: boolean;

  /** DTO / class for request body - will be automatically inferred from method signature if not provided */
  bodyType?: NestType<any> | (new (...args: any[]) => any);

  /**
   * Manually defined path parameters
   * For automatic path param extraction, use 'pathParamsFrom' instead
   */
  params?: Array<{
    name: string;
    description?: string;
    type?: any;
    required?: boolean;
    enum?: any[];
  }>;

  /**
   * Manually defined query parameters
   * For automatic query param extraction, use 'queriesFrom' instead
   */
  queries?: Array<{
    name: string;
    description?: string;
    type?: any;
    required?: boolean;
    enum?: any[];
    example?: any;
  }>;

  /**
   * Automatically derive query params from one or more DTOs with @Field decorators
   * The decorator will read metadata stored by @Field decorators (where inQuery: true)
   * and generate @ApiQuery decorators for Swagger documentation
   *
   * @example
   * queriesFrom: [PaginationArgs, JobFilterDto]
   */
  queriesFrom?: (new (...args: any[]) => any) | Array<new (...args: any[]) => any>;

  /**
   * Automatically derive path params from one or more DTOs with @Field decorators
   * The decorator will read metadata stored by @Field decorators (where inPath: true)
   * and generate @ApiParam decorators for Swagger documentation
   *
   * @example
   * pathParamsFrom: JobIdPathParamsDto
   */
  pathParamsFrom?: (new (...args: any[]) => any) | Array<new (...args: any[]) => any>;

  /** Mark operation deprecated in Swagger UI */
  deprecated?: boolean;

  /** Shorthand to specify a single 200 response type */
  responseType?: NestType<any>;

  /** Shorthand to specify an array 200 response type */
  responseArrayType?: NestType<any>;

  /**
   * Shorthand to specify a paginated 200 response type
   * Generates a schema with { items: [], pageInfo: {}, totalCount: number, meta?: {} }
   */
  paginatedResponseType?: NestType<any>;

  /**
   * When true, wraps successful 2xx response in a standard envelope: { success, data, error? }
   * This metadata is also stored for use by interceptors
   */
  envelope?: boolean;
}

/**
 * @Api Decorator
 *
 * A powerful unified decorator for configuring Swagger/OpenAPI documentation in NestJS.
 * Combines multiple Swagger decorators into a single, declarative interface.
 *
 * Key Features:
 * - Automatic request body type inference from method signatures
 * - Auto-generation of query/path params from DTOs with @Field decorators
 * - Support for paginated, array, and enveloped responses
 * - Built-in authentication guard integration
 * - Flexible response configuration
 *
 * @param options - Configuration options for the API endpoint
 * @returns A method decorator that applies all necessary Swagger decorators
 *
 * @example
 * ```typescript
 * @Get()
 * @Api({
 *   summary: 'Get all jobs',
 *   description: 'Returns a paginated list of jobs with optional filters',
 *   paginatedResponseType: JobDto,
 *   queriesFrom: [PaginationArgs, JobFilterDto],
 *   envelope: true
 * })
 * async findAll(@Query() pagination: PaginationArgs, @Query() filters: JobFilterDto) {
 *   // ...
 * }
 * ```
 */
export function Api(options: ApiOptions): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    // ============================================================================
    // STEP 1: Automatic Body Type Inference
    // ============================================================================
    // Attempt to infer the request body type from the method's parameter types
    // if it hasn't been explicitly provided in the options.
    // This looks for DTO or Input classes in the method signature.
    // IMPORTANT: Skip DTOs that are specified in queriesFrom or pathParamsFrom
    if (!options.bodyType) {
      try {
        // Build list of DTOs used for queries/path params to exclude from body inference
        const queryParamTypes = [];
        if (options.queriesFrom) {
          if (Array.isArray(options.queriesFrom)) {
            queryParamTypes.push(...options.queriesFrom);
          } else {
            queryParamTypes.push(options.queriesFrom);
          }
        }

        const pathParamTypes = [];
        if (options.pathParamsFrom) {
          if (Array.isArray(options.pathParamsFrom)) {
            pathParamTypes.push(...options.pathParamsFrom);
          } else {
            pathParamTypes.push(options.pathParamsFrom);
          }
        }

        const excludedTypes = [...queryParamTypes, ...pathParamTypes];

        const paramTypes: any[] = Reflect.getMetadata('design:paramtypes', target, propertyKey) || [];
        const inferred = paramTypes.find((t) => {
          if (!t) return false;
          const isPrimitive = [String, Number, Boolean, Array, Object].includes(t);
          // Skip if this type is used for query or path params
          if (excludedTypes.includes(t)) return false;
          return !isPrimitive && /Dto|Input/i.test(t.name || '');
        });
        if (inferred) {
          options.bodyType = inferred;
        }
      } catch {
        /* ignore */
      }
    }

    // ============================================================================
    // STEP 2: Build API Operation Metadata
    // ============================================================================
    // Construct the ApiOperation options with summary, description, and deprecation info
    const op: ApiOperationOptions = {
      summary: options.summary,
      description: options.description,
      deprecated: options.deprecated,
      ...(options.apiOperationOptions || {}),
    } as ApiOperationOptions;

    // ============================================================================
    // STEP 3: Determine Response Strategy
    // ============================================================================
    // Check if the user has provided custom responses.
    // If they have, we skip adding default responses (Created, Unauthorized, Forbidden)
    const userProvidedResponses = (options.responses || options.apiResponses || []).filter((v) => Boolean(v)) as ApiResponseOptions[];
    const addDefaultSet = userProvidedResponses.length === 0; // Only add defaults when no custom responses passed

    // ============================================================================
    // STEP 4: Build Decorator Chain
    // ============================================================================
    // Start building the array of decorators that will be applied to the method
    const decorators: any[] = [];

    // Add authentication guards if required
    if (options.authenticationRequired) {
      decorators.push(ApiBearerAuth());
    }

    decorators.push(ApiOperation(op));

    // Add request body documentation if bodyType is specified
    if (options.bodyType) {
      decorators.push(ApiBody({type: options.bodyType}));
    }

    // ============================================================================
    // STEP 5: Path Parameters
    // ============================================================================
    // Add manually defined path parameters
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

    // Auto-generate path parameters from DTOs with @Field decorators
    // Reads metadata set by @Field(... inPath: true) decorators
    if (options.pathParamsFrom) {
      const sources = Array.isArray(options.pathParamsFrom) ? options.pathParamsFrom : [options.pathParamsFrom];
      sources.forEach((src) => {
        if (!src) return;
        // Read metadata from the class constructor (where @Field stores it)
        const meta = Reflect.getMetadata('cb:fieldMeta', src) || [];
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

    // ============================================================================
    // STEP 6: Query Parameters
    // ============================================================================
    // Add manually defined query parameters
    // Note: For manual queries, required defaults to false (must be explicitly true)
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

    // Auto-generate query parameters from DTOs with @Field decorators
    // Reads metadata set by @Field(... inQuery: true) decorators
    // IMPORTANT: We explicitly set required to true or false (not undefined)
    // to ensure Swagger correctly displays optional fields
    if (options.queriesFrom) {
      const sources = Array.isArray(options.queriesFrom) ? options.queriesFrom : [options.queriesFrom];
      sources.forEach((src) => {
        if (!src) return;
        // Retrieve metadata stored by @Field decorator on the class constructor
        const qMeta = Reflect.getMetadata('cb:fieldMeta', src) || [];
        qMeta
          .filter((m: any) => m.inQuery)
          .forEach((m: any) =>
            decorators.push(
              ApiQuery({
                name: m.name,
                description: m.description,
                // Explicitly set required to true or false (never undefined)
                // This ensures Swagger properly marks optional fields as not required
                required: m.required === true ? true : false,
                enum: m.enum,
                type: m.type,
              })
            )
          );
      });
    }

    // ============================================================================
    // STEP 7: Response Documentation
    // ============================================================================
    // Generate response schemas based on the provided options
    // Shorthand 200 response helpers (only if user didn't explicitly define 200)
    const hasExplicit200 = userProvidedResponses.some((r) => r.status === 200);
    if (!hasExplicit200) {
      // Single object response
      if (options.responseType) {
        if (options.envelope) {
          // Wrapped in envelope: { success: true, data: {...} }
          decorators.push(
            ApiResponse({
              status: 200,
              description: 'Successful response',
              schema: {
                type: 'object',
                properties: {
                  success: {type: 'boolean', example: true},
                  data: {$ref: getSchemaPath(options.responseType)},
                },
              },
            })
          );
        } else {
          // Direct response without envelope
          decorators.push(ApiResponse({status: 200, description: 'Successful response', type: options.responseType}));
        }
      }
      // Array response
      else if (options.responseArrayType) {
        const arraySchema = {
          type: 'array',
          items: {$ref: getSchemaPath(options.responseArrayType)},
        };
        if (options.envelope) {
          // Wrapped in envelope: { success: true, data: [...] }
          decorators.push(
            ApiResponse({
              status: 200,
              description: 'Successful response',
              schema: {
                type: 'object',
                properties: {
                  success: {type: 'boolean', example: true},
                  data: arraySchema,
                },
              },
            })
          );
        } else {
          // Direct array response
          decorators.push(
            ApiResponse({
              status: 200,
              description: 'Successful response',
              schema: arraySchema,
            })
          );
        }
      }
      // Paginated response with items, pageInfo, totalCount, and optional meta
      else if (options.paginatedResponseType) {
        const basePaginated = {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {$ref: getSchemaPath(options.paginatedResponseType)},
            },
            pageInfo: {
              type: 'object',
              properties: {
                hasNextPage: {type: 'boolean'},
                hasPreviousPage: {type: 'boolean'},
                startCursor: {type: 'string', nullable: true},
                endCursor: {type: 'string', nullable: true},
              },
            },
            totalCount: {type: 'number'},
            meta: {
              type: 'object',
              additionalProperties: true,
              nullable: true,
              description: 'Optional metadata related to this collection (e.g., company, tag, filters)',
            },
          },
        };
        if (options.envelope) {
          // Wrapped in envelope: { success: true, data: { items, pageInfo, totalCount, meta } }
          decorators.push(
            ApiResponse({
              status: 200,
              description: 'Successful response',
              schema: {
                type: 'object',
                properties: {
                  success: {type: 'boolean', example: true},
                  data: basePaginated,
                },
              },
            })
          );
        } else {
          // Direct paginated response
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

    // ============================================================================
    // STEP 8: Default Error Responses
    // ============================================================================
    // Add default error responses (401, 201, 403) if user hasn't provided custom responses
    if (addDefaultSet) {
      decorators.push(ApiUnauthorizedResponse({description: 'Unauthorized'}));
      decorators.push(ApiCreatedResponse({description: 'The record has been successfully created.'}));
      decorators.push(ApiForbiddenResponse({description: 'Forbidden.'}));
    } else {
      // If user provided custom responses, ensure 401 is still added for authenticated endpoints
      let has401 = userProvidedResponses.some((r) => r.status === 401);
      if (options.authenticationRequired && !has401) {
        decorators.push(ApiUnauthorizedResponse({description: 'Unauthorized'}));
        has401 = true;
      }
    }

    // ============================================================================
    // STEP 9: Add User-Provided Responses
    // ============================================================================
    // Add any custom responses provided by the user
    if (userProvidedResponses.length > 0) {
      userProvidedResponses.forEach((r) => decorators.push(ApiResponse(r)));
    }

    // ============================================================================
    // STEP 10: Store Metadata for Interceptors
    // ============================================================================
    // Store envelope metadata so interceptors can wrap responses appropriately
    if (options.envelope) {
      try {
        Reflect.defineMetadata('cb:envelope', true, descriptor.value);
      } catch {
        /* ignore */
      }
    }

    // ============================================================================
    // STEP 11: Apply All Decorators
    // ============================================================================
    // Apply all collected decorators to the target method
    applyDecorators(...decorators)(target, propertyKey, descriptor);
  };
}
