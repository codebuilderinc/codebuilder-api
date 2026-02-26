import {Field} from '@/common/decorators/field.decorator';

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
  @Field({
    name: 'createdAt',
    description: 'Sort by creation date',
    enum: SortOrder,
    optional: true,
    inQuery: true,
    isEnum: {entity: SortOrder},
  })
  createdAt?: SortOrder;

  @Field({
    name: 'updatedAt',
    description: 'Sort by last update date',
    enum: SortOrder,
    optional: true,
    inQuery: true,
    isEnum: {entity: SortOrder},
  })
  updatedAt?: SortOrder;

  @Field({
    name: 'postedAt',
    description: 'Sort by original posting date',
    enum: SortOrder,
    optional: true,
    inQuery: true,
    isEnum: {entity: SortOrder},
  })
  postedAt?: SortOrder;

  @Field({
    name: 'title',
    description: 'Sort by job title',
    enum: SortOrder,
    optional: true,
    inQuery: true,
    isEnum: {entity: SortOrder},
  })
  title?: SortOrder;

  @Field({
    name: 'company',
    description: 'Sort by company name',
    enum: SortOrder,
    optional: true,
    inQuery: true,
    isEnum: {entity: SortOrder},
  })
  company?: SortOrder;
}
