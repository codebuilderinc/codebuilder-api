import { ApiProperty } from '@nestjs/swagger';

export class PageInfo {
  @ApiProperty({ required: false, nullable: true, description: 'Cursor of last item in current page' })
  endCursor?: string;

  @ApiProperty({ description: 'Is there another page after this one?' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Is there a page before this one?' })
  hasPreviousPage: boolean;

  @ApiProperty({ required: false, nullable: true, description: 'Cursor of first item in current page' })
  startCursor?: string;

  // Retained for backward compatibility in REST where totalCount previously lived under pageInfo
  @ApiProperty({
    description: '(Deprecated – use top-level totalCount) Total number of matching items',
    required: false,
  })
  totalCount?: number;
}
