import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsInt, IsString, IsBoolean } from 'class-validator';
import { PaginationArgs } from '../../common/pagination/pagination.args';
import { JobOrderByDto } from '../dto/job-order-by.dto';

/**
 * Job Query Arguments
 *
 * GraphQL arguments for querying job listings.
 * Extends PaginationArgs to include pagination support.
 *
 * Supports:
 * - Pagination (from PaginationArgs)
 * - Sorting (orderBy)
 * - Text search in title and description
 * - Filtering by company, location, remote status
 * - Filtering by tags
 */
@ArgsType()
export class JobArgs extends PaginationArgs {
  @Field(() => JobOrderByDto, { nullable: true })
  @IsOptional()
  orderBy?: JobOrderByDto;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  companyId?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isRemote?: boolean;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
