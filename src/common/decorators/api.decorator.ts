import { applyDecorators } from '@nestjs/common';
import { UseGuards, SetMetadata } from '@nestjs/common';
import { InputType, Field as GraphQLField } from '@nestjs/graphql';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperationOptions,
  ApiResponseOptions,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthUser, RedisAuthGuard } from './../auth/redis-auth.guard';

type ApiOptions = {
  apiOperationOptions?: Partial<ApiOperationOptions>;
  apiResponses?: Partial<ApiResponseOptions>[];
  authenticationRequired?: boolean;
};

export function Api(apiOptions: ApiOptions) {
  const properties = [
    apiOptions.authenticationRequired ? UseGuards(RedisAuthGuard) : null,
    apiOptions.authenticationRequired ? ApiBearerAuth() : null,
    //InputType(),
    ApiOperation(apiOptions?.apiOperationOptions),
    //SetMetadata('roles', roles),
    //UseGuards(AuthGuard, RolesGuard),
    //ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiCreatedResponse({ description: 'The record has been successfully created.' }),
    ApiForbiddenResponse({ description: 'Forbidden.' }),
  ];

  const decorators = properties.filter((elements) => {
    return elements !== null;
  });

  return applyDecorators(...decorators);
}
