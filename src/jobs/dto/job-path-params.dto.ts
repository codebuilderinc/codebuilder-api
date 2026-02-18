import { Field } from '@/common/decorators/field.decorator';

export class CompanyPathParamsDto {
  @Field({
    name: 'companyId',
    description: 'Company ID',
    isInt: { message: 'companyId must be an integer.' },
    inPath: true,
    type: Number,
  })
  companyId!: number;
}

export class TagPathParamsDto {
  @Field({
    name: 'tagName',
    description: 'Tag name',
    isString: { message: 'tagName must be a string.' },
    inPath: true,
    type: String,
  })
  tagName!: string;
}

export class JobIdPathParamsDto {
  @Field({
    name: 'id',
    description: 'Job ID',
    isInt: { message: 'id must be an integer.' },
    inPath: true,
    type: Number,
  })
  id!: number;
}
