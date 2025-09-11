import { Field, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType()
export class PageInfo {
  @ApiProperty({ required: false, nullable: true, description: 'Cursor of last item in current page' })
  @Field(() => String, { nullable: true })
  endCursor?: string;

  @ApiProperty({ description: 'Is there another page after this one?' })
  @Field(() => Boolean)
  hasNextPage: boolean;

  @ApiProperty({ description: 'Is there a page before this one?' })
  @Field(() => Boolean)
  hasPreviousPage: boolean;

  @ApiProperty({ required: false, nullable: true, description: 'Cursor of first item in current page' })
  @Field(() => String, { nullable: true })
  startCursor?: string;

  // Retained for backward compatibility in REST where totalCount previously lived under pageInfo
  @ApiProperty({
    description: '(Deprecated – use top-level totalCount) Total number of matching items',
    required: false,
  })
  @Field(() => Number, { nullable: true })
  totalCount?: number;
}
