import { ObjectType, Field } from '@nestjs/graphql';
import { PaginatedResponse } from '../../common/models/paginated-response.model';
import { Job } from './job.model';

/**
 * GraphQL ObjectType for paginated job responses
 * Extends the base PaginatedResponse to provide job-specific pagination
 */
@ObjectType()
export class JobConnection implements PaginatedResponse<Job> {
    results: Job[];
    hasNextPage: boolean;
    cursor?: string;
    @Field(() => [Job])
    items: Job[];
}
