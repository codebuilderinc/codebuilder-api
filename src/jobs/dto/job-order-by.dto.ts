import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { InputType, Field as GraphQLField, registerEnumType } from '@nestjs/graphql';

/**
 * Sort order enum for job queries
 */
export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

// Register enum for GraphQL
registerEnumType(SortOrder, {
    name: 'SortOrder',
    description: 'Sort order for queries',
});

/**
 * Job Order By DTO
 *
 * Data Transfer Object for specifying sort order in job queries.
 * Allows sorting by various job fields in ascending or descending order.
 *
 * Available sort fields:
 * - createdAt: When the job record was created
 * - updatedAt: When the job record was last updated
 * - postedAt: When the job was originally posted
 * - title: Job title (alphabetical)
 * - company: Company name (alphabetical)
 */
@InputType()
export class JobOrderByDto {
    @ApiProperty({
        description: 'Sort by creation date',
        enum: SortOrder,
        required: false,
    })
    @GraphQLField(() => SortOrder, { nullable: true })
    @IsOptional()
    @IsEnum(SortOrder)
    createdAt?: SortOrder;

    @ApiProperty({
        description: 'Sort by last update date',
        enum: SortOrder,
        required: false,
    })
    @GraphQLField(() => SortOrder, { nullable: true })
    @IsOptional()
    @IsEnum(SortOrder)
    updatedAt?: SortOrder;

    @ApiProperty({
        description: 'Sort by original posting date',
        enum: SortOrder,
        required: false,
    })
    @GraphQLField(() => SortOrder, { nullable: true })
    @IsOptional()
    @IsEnum(SortOrder)
    postedAt?: SortOrder;

    @ApiProperty({
        description: 'Sort by job title',
        enum: SortOrder,
        required: false,
    })
    @GraphQLField(() => SortOrder, { nullable: true })
    @IsOptional()
    @IsEnum(SortOrder)
    title?: SortOrder;

    @ApiProperty({
        description: 'Sort by company name',
        enum: SortOrder,
        required: false,
    })
    @GraphQLField(() => SortOrder, { nullable: true })
    @IsOptional()
    @IsEnum(SortOrder)
    company?: SortOrder;
}
