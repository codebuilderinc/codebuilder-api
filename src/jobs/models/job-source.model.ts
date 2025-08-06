// import { Field, ObjectType, Int } from '@nestjs/graphql';
// import { BaseModel } from '../../common/models/base.model';
// import { Job } from './job.model';

// /**
//  * GraphQL ObjectType for JobSource entities
//  * Represents the source information for jobs (where they came from)
//  */
// @ObjectType()
// export class JobSource extends BaseModel {
//     /**
//      * The ID of the job this source belongs to
//      * @example 1
//      */
//     @Field(() => Int)
//     jobId: number;

//     /**
//      * The name of the source
//      * @example "reddit"
//      */
//     @Field()
//     source: string;

//     /**
//      * The external ID from the source system (optional)
//      * @example "abc123"
//      */
//     @Field({ nullable: true })
//     externalId?: string | null;

//     /**
//      * The original URL from the source site (optional)
//      * @example "https://reddit.com/r/jobs/comments/abc123"
//      */
//     @Field({ nullable: true })
//     rawUrl?: string | null;

//     /**
//      * Raw data from the source system (optional)
//      * Stored as JSON string for flexibility
//      */
//     @Field({ nullable: true })
//     data?: string | null;

//     /**
//      * The job this source belongs to
//      * Many-to-one relationship with Job
//      */
//     @Field(() => Job)
//     job: Job;
// }
