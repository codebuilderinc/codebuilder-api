import { ArgsType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { Field } from '../decorators/field.decorator';

@ArgsType()
export class PaginationArgs {
  @Type(() => Number)
  @Field({
    name: 'skip',
    description: 'Number of records to skip (offset based pagination).',
    isInt: { message: 'skip must be an integer.' },
    optional: true,
    inQuery: true,
    example: 0,
    type: Number,
  })
  skip?: number;

  @Field({
    name: 'after',
    description: 'Cursor to start after (forward cursor pagination).',
    isString: { message: 'after must be a string cursor.' },
    optional: true,
    inQuery: true,
    example: 'cursor123',
    type: String,
  })
  after?: string;

  @Field({
    name: 'before',
    description: 'Cursor to end before (backward cursor pagination).',
    isString: { message: 'before must be a string cursor.' },
    optional: true,
    inQuery: true,
    example: 'cursor122',
    type: String,
  })
  before?: string;

  @Type(() => Number)
  @Field({
    name: 'first',
    description: 'Max number of items to return going forward from the cursor.',
    isInt: { message: 'first must be an integer.' },
    optional: true,
    inQuery: true,
    example: 25,
    type: Number,
  })
  first?: number;

  @Type(() => Number)
  @Field({
    name: 'last',
    description: 'Max number of items to return going backward from the cursor.',
    isInt: { message: 'last must be an integer.' },
    optional: true,
    inQuery: true,
    example: 25,
    type: Number,
  })
  last?: number;
}
