import { Module } from '@nestjs/common';
import { JobService } from './job.service';
import { JobController } from './job.controller';
//import { JobResolver } from './job.resolver';
import { CommonModule } from '../common/common.module';
import { Web3CareerService } from './web3career.service';
import { RedditService } from './reddit.service';
import { NotificationsService } from './notifications.service';

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
  providers: [JobService, Web3CareerService, RedditService, NotificationsService], // Business logic and GraphQL resolvers //JobResolver
  exports: [JobService, Web3CareerService, RedditService, NotificationsService], // Allow other modules to use these services
})
export class JobModule {}
