import { Field, ObjectType, Int } from '@nestjs/graphql';
import { BaseModel } from '../../common/models/base.model';
import { Company } from './company.model';
import { JobTag } from './job-tag.model';
import { JobSource } from './job-source.model';

/**
 * GraphQL ObjectType for Job entities
 * Represents a job posting with all its properties and relationships
 */
@ObjectType()
export class Job extends BaseModel {
    /**
     * The title of the job posting
     * @example "Senior Full Stack Developer"
     */
    @Field()
    title: string;

    /**
     * The ID of the company posting the job (optional)
     * @example 1
     */
    @Field(() => Int, { nullable: true })
    companyId?: number | null;

    /**
     * The company that posted the job (optional)
     * Resolved from the companyId field
     */
    @Field(() => Company, { nullable: true })
    company?: Company | null;

    /**
     * The author of the job posting (optional)
     * @example "John Doe"
     */
    @Field({ nullable: true })
    author?: string | null;

    /**
     * The location of the job (optional)
     * @example "New York, NY"
     */
    @Field({ nullable: true })
    location?: string | null;

    /**
     * The unique URL of the job posting
     * @example "https://example.com/job/123"
     */
    @Field()
    url: string;

    /**
     * The date when the job was originally posted (optional)
     * @example "2023-01-15T10:30:00Z"
     */
    @Field({ nullable: true })
    postedAt?: Date | null;

    /**
     * The detailed description of the job (optional)
     * @example "We are looking for a skilled developer..."
     */
    @Field({ nullable: true })
    description?: string | null;

    /**
     * Whether the job is remote (optional)
     * @example true
     */
    @Field({ nullable: true })
    isRemote?: boolean | null;

    /**
     * Tags associated with this job
     * Many-to-many relationship through JobTag
     */
    @Field(() => [JobTag], { nullable: true })
    tags?: JobTag[];

    /**
     * Metadata associated with this job
     * One-to-many relationship with JobMetadata
     */
    @Field(() => [() => JobMetadata], { nullable: true })
    metadata?: JobMetadata[];

    /**
     * Source information for this job
     * One-to-many relationship with JobSource
     */
    @Field(() => [JobSource], { nullable: true })
    sources?: JobSource[];
}

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
    @Field(() => () => typeof Job)
    job: Job;
}
