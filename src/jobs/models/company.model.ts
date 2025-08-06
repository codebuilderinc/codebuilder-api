// import { Field, ObjectType, Int } from '@nestjs/graphql';
// import { BaseModel } from '../../common/models/base.model';
// import { Job } from './job.model';

// /**
//  * GraphQL ObjectType for Company entities
//  * Represents a company that posts jobs
//  */
// @ObjectType()
// export class Company extends BaseModel {
//     /**
//      * The name of the company
//      * @example "Tech Corp Inc."
//      */
//     @Field()
//     name: string;

//     /**
//      * Jobs posted by this company
//      * One-to-many relationship with Job
//      */
//     @Field(() => [Job], { nullable: true })
//     jobs?: Job[];
// }
