import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiQuery, ApiQueryOptions, getSchemaPath } from '@nestjs/swagger';
import 'reflect-metadata';

const generateApiQueryObject = (prop: any, propType: any, required: boolean, isArray: boolean): ApiQueryOptions => {
    if (propType === Number) {
        return {
            required,
            name: prop,
            style: 'deepObject',
            explode: true,
            type: 'number',
            isArray,
        };
    } else if (propType === String) {
        return {
            required,
            name: prop,
            style: 'deepObject',
            explode: true,
            type: 'string',
            isArray,
        };
    } else {
        return {
            required,
            name: prop,
            style: 'deepObject',
            explode: true,
            type: 'object',
            isArray,
            schema: {
                $ref: getSchemaPath(propType),
            },
        };
    }
};

export function ApiNestedQuery(query: new (...args: any[]) => any) {
    const constructor = query.prototype;
    const properties = Reflect.getMetadata('swagger/apiModelPropertiesArray', constructor).map((prop: any) => prop.slice(1));

    const decorators = properties
        .map((property: any) => {
            const { required, isArray } = Reflect.getMetadata('swagger/apiModelProperties', constructor, property);
            const propertyType = Reflect.getMetadata('design:type', constructor, property);
            const typedQuery = generateApiQueryObject(property, propertyType, required, isArray);
            return [ApiExtraModels(propertyType), ApiQuery(typedQuery)];
        })
        .flat();

    return applyDecorators(...decorators);
}

/**
 * API Pagination Query Decorator
 *
 * Generates Swagger documentation for pagination query parameters.
 * This decorator adds common pagination parameters to the API documentation.
 */
export function ApiPaginationQuery() {
    return applyDecorators(
        ApiQuery({
            name: 'skip',
            required: false,
            type: Number,
            description: 'Number of items to skip',
            example: 0,
        }),
        ApiQuery({
            name: 'first',
            required: false,
            type: Number,
            description: 'Number of items to return',
            example: 10,
        }),
        ApiQuery({
            name: 'after',
            required: false,
            type: String,
            description: 'Cursor for pagination (after)',
        }),
        ApiQuery({
            name: 'before',
            required: false,
            type: String,
            description: 'Cursor for pagination (before)',
        }),
        ApiQuery({
            name: 'last',
            required: false,
            type: Number,
            description: 'Number of items to return from the end',
        })
    );
}
