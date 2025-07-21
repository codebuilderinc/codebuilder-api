import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { JobResolver } from './job.resolver';
import { CommonModule } from '../common/common.module';

/**
 * Job Module
 *
 * Provides job management functionality including:
 * - REST API endpoints for job operations
 * - GraphQL resolvers for job queries and mutations
 * - Job service with business logic
 * - Integration with database and authentication
 *
 * This module handles all job-related operations including creating,
 * reading, updating, and deleting job listings, as well as managing
 * job tags, metadata, and company associations.
 */
@Module({
    imports: [
        CommonModule, // Provides database, authentication, and other shared services
    ],
    controllers: [JobController], // REST API endpoints
    providers: [JobService, JobResolver], // Business logic and GraphQL resolvers
    exports: [JobService], // Allow other modules to use JobService
})
export class JobModule {}
