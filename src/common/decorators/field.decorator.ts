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
  ValidationOptions,
} from 'class-validator';
import {pick} from './../../common/helpers/array.helper';
import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import ValidatorJS from 'validator';

type FieldOptions = {
  name: string; // explicit name override (optional for consistency)
  description: string;
  example?: unknown;
  enum?: unknown;
  type?: unknown; // override Swagger type
  optional?: boolean; // marks field optional
  nullable?: boolean; // kept for backwards compat; implies optional
  minLength?: number;
  maxLength?: number;
  isEnum?: {entity: object; validationOptions?: ValidationOptions};
  isString?: ValidationOptions;
  isEthereumAddress?: ValidationOptions;
  isDecimal?: {options?: ValidatorJS.IsDecimalOptions; validationOptions: ValidationOptions};
  isBoolean?: ValidationOptions;
  isInt?: ValidationOptions;
  isBigInt?: {message: string};
  isHash?: {algorithm: string; validationOptions: ValidationOptions};
  isUrl?: ValidationOptions;
  pattern?: {regex: RegExp; message?: string};
  isArray?: boolean;
  inQuery?: boolean; // mark field as query parameter candidate
  inPath?: boolean; // mark field as path parameter candidate
};

export function Field(options: FieldOptions) {
  const required = !(options.optional || options.nullable);

  const swaggerMeta: any = pick(options, ['description', 'example', 'enum', 'type']);
  if (options.isArray) swaggerMeta.isArray = true;
  if (!required) swaggerMeta.required = false;

  // Return a property decorator that has access to target (the class prototype)
  return function (target: any, propertyKey: string | symbol) {
    // Swagger property decorator
    // IMPORTANT: Only apply ApiProperty/ApiPropertyOptional if this field is NOT a query or path parameter
    // Query and path parameters are documented via @ApiQuery and @ApiParam in the @Api decorator
    // Applying ApiProperty here would treat them as body properties, causing Swagger UI issues
    if (!options.inQuery && !options.inPath) {
      if (required) {
        ApiProperty(swaggerMeta)(target, propertyKey);
      } else {
        ApiPropertyOptional(swaggerMeta)(target, propertyKey);
      }
    }

    if (!required) {
      IsOptional()(target, propertyKey);
    } else {
      IsNotEmpty({message: options.name + ': Value is required.'})(target, propertyKey);
    }

    if (options.isEnum) {
      IsEnum(options.isEnum.entity, options.isEnum.validationOptions || {message: options.name + ': Invalid enum value.'})(
        target,
        propertyKey
      );
    }
    if (options.isString) IsString(options.isString)(target, propertyKey);
    if (options.minLength) MinLength(options.minLength)(target, propertyKey);
    if (options.maxLength) MaxLength(options.maxLength)(target, propertyKey);
    if (options.isEthereumAddress) IsEthereumAddress(options.isEthereumAddress)(target, propertyKey);
    if (options.isDecimal) IsDecimal(options.isDecimal.options, options.isDecimal.validationOptions)(target, propertyKey);
    if (options.isBoolean) IsBoolean(options.isBoolean)(target, propertyKey);
    if (options.isInt) IsInt(options.isInt)(target, propertyKey);
    if (options.isBigInt) IsInt({message: options.isBigInt.message})(target, propertyKey);
    if (options.isHash) IsHash(options.isHash.algorithm, options.isHash.validationOptions)(target, propertyKey);
    if (options.isUrl) IsUrl(undefined, options.isUrl)(target, propertyKey);
    if (options.pattern) Matches(options.pattern.regex, {message: options.pattern.message})(target, propertyKey);
    if (options.isArray) IsArray()(target, propertyKey);

    // Persist metadata on the class constructor so @Api decorator can build params/queries automatically
    // Use the constructor (target.constructor) to store class-level metadata
    try {
      const metaKey = 'cb:fieldMeta';
      const constructor = target.constructor;
      const existing: any[] = Reflect.getMetadata(metaKey, constructor) || [];
      // Only add if not already present (avoid duplicates)
      if (!existing.some((m) => m.name === options.name)) {
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
        Reflect.defineMetadata(metaKey, existing, constructor);
      }
    } catch {
      /* ignore metadata errors */
    }
  };
}
