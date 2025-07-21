import {
    IsInt,
    ArrayMaxSize,
    ArrayMinSize,
    Contains,
    IsArray,
    IsBoolean,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsEthereumAddress,
    IsString,
    IsUrl,
    Length,
    Validate,
    Matches,
    IsHash,
    IsEnum,
    MinLength,
    ValidateIf,
    ValidateNested,
    isDecimal,
    IsDecimal,
} from 'class-validator';
import { Type, plainToClass } from 'class-transformer';
import { pick } from './../../common/helpers/array.helper';
import { EndsWithValidator } from '../../common/validation/ends-with.decorator';
import { applyDecorators } from '@nestjs/common';
import { UseGuards, SetMetadata } from '@nestjs/common';
import { InputType, Field as GraphQLField } from '@nestjs/graphql';
import { validate, ValidationOptions } from 'class-validator';
import {
    ApiTags,
    ApiResponse,
    ApiOperation,
    ApiUnauthorizedResponse,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiExtraModels,
    ApiQuery,
    ApiProperty,
    ApiQueryOptions,
    getSchemaPath,
} from '@nestjs/swagger';
import ValidatorJS from 'validator';
import { IsType } from '../../common/validation/is-type.decorator';

//declare class RELATED_ENTITY_FIND_MANY_ARGS {}
//plainToClass(RELATED_ENTITY_FIND_MANY_ARGS, request.query);

type FieldOptions = {
    name: string;
    description: string;
    example?: unknown;
    fieldType?: 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function';
    enum?: unknown;
    type?: unknown;
    defaultValidationMessage?: string;
    nullable?: boolean;
    isNototEmpty?: ValidationOptions;
    isEnum?: {
        entity: object;
        validationOptions?: ValidationOptions;
    };
    isString?: ValidationOptions;
    isEthereumAddress?: ValidationOptions;
    isDecimal?: {
        options?: ValidatorJS.IsDecimalOptions;
        validationOptions: ValidationOptions;
    };
    isBoolean?: ValidationOptions;
    isInt?: ValidationOptions;
    isBigInt?: {
        message: string;
    };
    isHash?: {
        algorithm: string;
        validationOptions: ValidationOptions;
    };
};

export function Field(options: FieldOptions) {
    const required = options.nullable ? false : true;

    const properties = [
        GraphQLField(pick(options, ['nullable', 'name', 'description', 'type'])),
        ApiProperty(pick(options, ['name', 'description', 'example', 'nullable', 'type', 'enum'])),
        options.isEnum && required
            ? IsEnum(options.isEnum.entity, options.isEnum.validationOptions || { message: options.defaultValidationMessage || options.name + ': Invalid enum value.' })
            : null,
        required ? IsNotEmpty({ message: options.name + ': Value is required.' }) : null,
        options.isEthereumAddress && required ? IsEthereumAddress(options.isEthereumAddress) : null,
        options.isDecimal && required ? IsDecimal(options.isDecimal.options, options.isDecimal.validationOptions) : null,
        options.isBoolean && required ? IsBoolean(options.isBoolean) : null,
        options.isInt && required ? IsInt(options.isInt) : null,
        options.isBigInt && required ? IsInt(options.isBigInt) && IsType(['bigint', 'number', 'string']) : null,
        options.isHash && required ? IsHash(options.isHash?.algorithm, options.isHash?.validationOptions) : null,
        options.isString && required ? IsString(options.isString) : null,
    ];

    const decorators = properties.filter((elements) => {
        return elements !== null;
    });

    return applyDecorators(...decorators);
}
