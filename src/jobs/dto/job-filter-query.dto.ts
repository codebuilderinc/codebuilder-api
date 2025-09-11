import { Field } from '../../common/decorators/field.decorator';

export class JobFilterQueryDto {
  @Field({
    name: 'search',
    description: 'Search in job title and description',
    isString: { message: 'search must be a string.' },
    optional: true,
    inQuery: true,
    type: String,
  })
  search?: string;

  @Field({
    name: 'companyId',
    description: 'Filter by company ID',
    isInt: { message: 'companyId must be an integer.' },
    optional: true,
    inQuery: true,
    type: Number,
  })
  companyId?: number;

  @Field({
    name: 'location',
    description: 'Filter by location',
    isString: { message: 'location must be a string.' },
    optional: true,
    inQuery: true,
    type: String,
  })
  location?: string;

  @Field({
    name: 'isRemote',
    description: 'Filter by remote status',
    isBoolean: { message: 'isRemote must be a boolean.' },
    optional: true,
    inQuery: true,
    type: Boolean,
  })
  isRemote?: boolean;

  @Field({
    name: 'tags',
    description: 'Filter by tag names (comma-separated)',
    isString: { message: 'tags must be a comma-separated string.' },
    optional: true,
    inQuery: true,
    type: String,
  })
  tags?: string;
}
