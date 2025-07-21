import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JobService } from './job.service';
import { Job } from './models/job.model';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobArgs } from './args/job.args';
import { GqlAuthGuard } from '../common/auth/gql-auth.guard';
import { UserEntity as User } from './../common/decorators/user.decorator';

/**
 * Job GraphQL Resolver
 *
 * Provides GraphQL queries and mutations for job management.
 * Handles both public queries (viewing jobs) and protected mutations
 * (creating, updating, deleting jobs).
 *
 * Queries:
 * - jobs: Get paginated list of jobs with filtering
 * - job: Get single job by ID
 * - jobsByCompany: Get jobs for a specific company
 * - jobsByTag: Get jobs with a specific tag
 *
 * Mutations:
 * - createJob: Create a new job listing
 * - updateJob: Update an existing job listing
 * - deleteJob: Delete a job listing
 */
@Resolver(() => Job)
export class JobResolver {
    constructor(private readonly jobService: JobService) {}

    /**
     * Get all jobs with optional filtering and pagination
     * Public query - no authentication required
     */
    @Query(() => [Job])
    async jobs(@Args() args: JobArgs) {
        const result = await this.jobService.findAll({
            paginationArgs: args,
            orderBy: args.orderBy,
            search: args.search,
            companyId: args.companyId,
            location: args.location,
            isRemote: args.isRemote,
            tags: args.tags,
        });
        return result.jobs;
    }

    /**
     * Get a single job by ID
     * Public query - no authentication required
     */
    @Query(() => Job, { name: 'job' })
    async findOne(@Args('id', { type: () => Int }) id: number) {
        return this.jobService.findOne(id);
    }

    /**
     * Get jobs for a specific company
     * Public query - no authentication required
     */
    @Query(() => [Job])
    async jobsByCompany(@Args('companyId', { type: () => Int }) companyId: number, @Args() args: JobArgs) {
        const result = await this.jobService.findByCompany(companyId, args, args.orderBy);
        return result.jobs;
    }

    /**
     * Get jobs with a specific tag
     * Public query - no authentication required
     */
    @Query(() => [Job])
    async jobsByTag(@Args('tagName') tagName: string, @Args() args: JobArgs) {
        const result = await this.jobService.findByTag(tagName, args, args.orderBy);
        return result.jobs;
    }

    /**
     * Create a new job listing
     * Protected mutation - requires authentication
     */
    @Mutation(() => Job)
    @UseGuards(GqlAuthGuard)
    async createJob(@Args('createJobInput') createJobDto: CreateJobDto, @User() user: any) {
        return this.jobService.create(createJobDto, user.id);
    }

    /**
     * Update an existing job listing
     * Protected mutation - requires authentication
     */
    @Mutation(() => Job)
    @UseGuards(GqlAuthGuard)
    async updateJob(@Args('id', { type: () => Int }) id: number, @Args('updateJobInput') updateJobDto: UpdateJobDto, @User() user: any) {
        return this.jobService.update(id, updateJobDto, user.id);
    }

    /**
     * Delete a job listing
     * Protected mutation - requires authentication
     */
    @Mutation(() => Boolean)
    @UseGuards(GqlAuthGuard)
    async deleteJob(@Args('id', { type: () => Int }) id: number, @User() user: any) {
        await this.jobService.remove(id, user.id);
        return true;
    }
}
