import { Field, ObjectType, Int } from '@nestjs/graphql';
import { BaseModel } from '../../common/models/base.model';
import { JobTag } from './job-tag.model';

/**
 * GraphQL ObjectType for Tag entities
 * Represents a tag that can be associated with jobs
 */
@ObjectType()
export class Tag extends BaseModel {
    /**
     * The name of the tag
     * @example "JavaScript"
     */
    @Field()
    name: string;

    /**
     * Jobs associated with this tag
     * Many-to-many relationship through JobTag
     */
    @Field(() => [JobTag], { nullable: true })
    jobTags?: JobTag[];
}
