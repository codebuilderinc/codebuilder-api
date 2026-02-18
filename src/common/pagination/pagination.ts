import { Type } from '@nestjs/common';
import { PageInfo } from './page-info.model';
import { ApiProperty } from '@nestjs/swagger';

export default function Paginated<TItem>(TItemClass: Type<TItem>) {
  abstract class EdgeType {
    cursor: string;
    node: TItem;
  }

  abstract class PaginatedType {
    @ApiProperty({ type: [EdgeType], nullable: true })
    edges: Array<EdgeType>;

    @ApiProperty({ type: PageInfo })
    pageInfo: PageInfo;

    @ApiProperty({ type: Number })
    totalCount: number;
  }
  return PaginatedType;
}
