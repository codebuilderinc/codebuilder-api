import {Module, forwardRef} from '@nestjs/common';
import {CommonModule} from '../common/common.module';
import {RedditService} from './reddit.service';
import {MessagesService} from './messages/messages.service';
import {MessagesController} from './messages/messages.controller';
import {PostsController} from './posts/posts.controller';
import {JobModule} from '../jobs/job.module';

/**
 * Reddit Module
 *
 * Provides shared Reddit integration functionality including:
 * - Fetching and storing Reddit job posts
 * - Checking Reddit inbox for new messages
 * - REST API endpoints for messages and posts
 *
 * RedditService is exported so it can be used by the JobModule's controller.
 */
@Module({
  imports: [
    CommonModule,
    forwardRef(() => JobModule), // Avoids circular dependency with JobModule
  ],
  controllers: [MessagesController, PostsController],
  providers: [RedditService, MessagesService],
  exports: [RedditService],
})
export class RedditModule {}
