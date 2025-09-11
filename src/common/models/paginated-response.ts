import { ApiProperty } from '@nestjs/swagger';
import { PageInfo } from '../pagination/page-info.model';

/**
 * Helper factory to create a Swagger-described paginated response class for a given item type.
 * Example: export class PaginatedJobResponse extends PaginatedResponse(JobDto) {}
 */
export function PaginatedResponse<T extends new (...args: any[]) => any>(ItemType: T) {
  class PaginatedResponseClass {
    @ApiProperty({ isArray: true, type: ItemType })
    items!: InstanceType<T>[];

    @ApiProperty({ type: () => PageInfo })
    pageInfo!: PageInfo;

    @ApiProperty({ description: 'Total number of matching items' })
    totalCount!: number;

    @ApiProperty({ description: 'Optional contextual metadata (e.g., company, tag)', required: false })
    meta?: Record<string, any> | null;
  }
  return PaginatedResponseClass;
}
