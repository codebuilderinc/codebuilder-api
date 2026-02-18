import { IsOptional, IsInt, IsString, IsBoolean } from 'class-validator';
import { PaginationArgs } from '../../common/pagination/pagination.args';
import { JobOrderByDto } from '../dto/job-order-by.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Job Query Arguments
 *
 * Arguments for querying job listings.
 * Extends PaginationArgs to include pagination support.
 *
 * Supports:
 * - Pagination (from PaginationArgs)
 * - Sorting (orderBy)
 * - Text search in title and description
 * - Filtering by company, location, remote status
 * - Filtering by tags
 */
export class JobArgs extends PaginationArgs {
  @ApiPropertyOptional({ type: JobOrderByDto })
  @IsOptional()
  orderBy?: JobOrderByDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  companyId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRemote?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
