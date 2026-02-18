import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';

/**
 * Sort order enum for job queries
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

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
export class JobOrderByDto {
  @ApiProperty({
    description: 'Sort by creation date',
    enum: SortOrder,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  createdAt?: SortOrder;

  @ApiProperty({
    description: 'Sort by last update date',
    enum: SortOrder,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  updatedAt?: SortOrder;

  @ApiProperty({
    description: 'Sort by original posting date',
    enum: SortOrder,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  postedAt?: SortOrder;

  @ApiProperty({
    description: 'Sort by job title',
    enum: SortOrder,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  title?: SortOrder;

  @ApiProperty({
    description: 'Sort by company name',
    enum: SortOrder,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  company?: SortOrder;
}
