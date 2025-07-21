import { Field, ObjectType, Int } from '@nestjs/graphql';
import { BaseModel } from '../../common/models/base.model';
import { Job } from './job.model';

/**
 * GraphQL ObjectType for JobMetadata entities
 * Represents arbitrary metadata associated with jobs
 */
@ObjectType()
export class JobMetadata extends BaseModel {
    /**
     * The ID of the job this metadata belongs to
     * @example 1
     */
    @Field(() => Int)
    jobId: number;

    /**
     * The name/key of the metadata
     * @example "salary_range"
     */
    @Field()
    name: string;

    /**
     * The value of the metadata
     * @example "$80,000 - $120,000"
     */
    @Field()
    value: string;

    /**
     * The job this metadata belongs to
     * Many-to-one relationship with Job
     */
    @Field(() => Job)
    job: Job;
}
