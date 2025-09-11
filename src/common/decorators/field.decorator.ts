import {
  IsInt,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsEthereumAddress,
  IsString,
  IsUrl,
  Matches,
  IsHash,
  IsEnum,
  MinLength,
  IsDecimal,
  MaxLength,
} from 'class-validator';
import { Type, plainToClass } from 'class-transformer';
import { pick } from './../../common/helpers/array.helper';
import { EndsWithValidator } from '../../common/validation/ends-with.decorator';
import { applyDecorators } from '@nestjs/common';
import { UseGuards, SetMetadata } from '@nestjs/common';
import { Field as GraphQLField } from '@nestjs/graphql';
import { validate, ValidationOptions } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import ValidatorJS from 'validator';
import { IsType } from '../../common/validation/is-type.decorator';

//declare class RELATED_ENTITY_FIND_MANY_ARGS {}
//plainToClass(RELATED_ENTITY_FIND_MANY_ARGS, request.query);

type FieldOptions = {
  name: string; // explicit name override (optional for consistency)
  description: string;
  example?: unknown;
  enum?: unknown;
  type?: unknown; // override GraphQL/Swagger type
  optional?: boolean; // marks field optional
  nullable?: boolean; // kept for backwards compat; implies optional
  minLength?: number;
  maxLength?: number;
  isEnum?: { entity: object; validationOptions?: ValidationOptions };
  isString?: ValidationOptions;
  isEthereumAddress?: ValidationOptions;
  isDecimal?: { options?: ValidatorJS.IsDecimalOptions; validationOptions: ValidationOptions };
  isBoolean?: ValidationOptions;
  isInt?: ValidationOptions;
  isBigInt?: { message: string };
  isHash?: { algorithm: string; validationOptions: ValidationOptions };
  isUrl?: ValidationOptions;
  pattern?: { regex: RegExp; message?: string };
  isArray?: boolean;
  inQuery?: boolean; // mark field as query parameter candidate
  inPath?: boolean; // mark field as path parameter candidate
};

export function Field(options: FieldOptions) {
  const required = !(options.optional || options.nullable);

  const swaggerMeta: any = pick(options, ['description', 'example', 'enum', 'type']);
  if (options.isArray) swaggerMeta.isArray = true;
  if (!required) swaggerMeta.required = false;

  const decorators: any[] = [];

  // GraphQL field
  decorators.push(GraphQLField(pick({ ...options, nullable: !required }, ['nullable', 'name', 'description', 'type'])));

  // Swagger property decorator
  if (required) {
    decorators.push(ApiProperty(swaggerMeta));
  } else {
    decorators.push(ApiPropertyOptional(swaggerMeta));
  }

  if (!required) {
    decorators.push(IsOptional());
  } else {
    decorators.push(IsNotEmpty({ message: options.name + ': Value is required.' }));
  }

  if (options.isEnum) {
    decorators.push(
      IsEnum(
        options.isEnum.entity,
        options.isEnum.validationOptions || { message: options.name + ': Invalid enum value.' }
      )
    );
  }
  if (options.isString) decorators.push(IsString(options.isString));
  if (options.minLength) decorators.push(MinLength(options.minLength));
  if (options.maxLength) decorators.push(MaxLength(options.maxLength));
  if (options.isEthereumAddress) decorators.push(IsEthereumAddress(options.isEthereumAddress));
  if (options.isDecimal) decorators.push(IsDecimal(options.isDecimal.options, options.isDecimal.validationOptions));
  if (options.isBoolean) decorators.push(IsBoolean(options.isBoolean));
  if (options.isInt) decorators.push(IsInt(options.isInt));
  if (options.isBigInt) decorators.push(IsInt({ message: options.isBigInt.message }));
  if (options.isHash) decorators.push(IsHash(options.isHash.algorithm, options.isHash.validationOptions));
  if (options.isUrl) decorators.push(IsUrl(undefined, options.isUrl));
  if (options.pattern) decorators.push(Matches(options.pattern.regex, { message: options.pattern.message }));
  if (options.isArray) decorators.push(IsArray());

  // Persist metadata so Api decorator can build params/queries automatically
  try {
    const targetClass = (options.type as any)?.prototype ? (options.type as any) : undefined;
    const storeTarget = targetClass || (global as any); // fallback
    const metaKey = 'cb:fieldMeta';
    const existing: any[] = Reflect.getMetadata(metaKey, storeTarget) || [];
    existing.push({
      name: options.name,
      description: options.description,
      enum: options.enum,
      isArray: options.isArray,
      required,
      inQuery: options.inQuery,
      inPath: options.inPath,
      type: options.type,
    });
    Reflect.defineMetadata(metaKey, existing, storeTarget);
  } catch {
    /* ignore metadata errors */
  }

  return applyDecorators(...decorators.filter(Boolean));
}
