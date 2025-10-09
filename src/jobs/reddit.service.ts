import { Injectable, Logger as Logger2 } from '@nestjs/common';
import { JobService } from './job.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationPayload } from '../notifications/interfaces/notification-payload.interface';
import { DatabaseService } from '../common/database/database.service';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class RedditService {
  private readonly logger2 = new Logger2(RedditService.name);

  constructor(
    private readonly jobService: JobService,
    private readonly notificationsService: NotificationsService,
    private readonly logger: LoggerService,
    private readonly db: DatabaseService
  ) {}
  async fetchRedditPosts(subreddits: string[]): Promise<any[]> {
    const axios = await import('axios');
    const allPosts = [];
    this.logger.info(`Fetching posts from ${subreddits.length} subreddit(s)`);
    for (const subreddit of subreddits) {
      try {
        this.logger.info(`Fetching /r/${subreddit}...`);
        const response = await axios.default.get(`https://www.reddit.com/r/${subreddit}/new.json?limit=10`, {
          timeout: 5000,
        });
        const subredditPosts = response.data.data.children.map((child: any) => ({
          title: child.data.title,
          author: child.data.author,
          subreddit: child.data.subreddit,
          url: child.data.url,
          postedAt: new Date(child.data.created_utc * 1000),
          body: child.data.selftext,
          bodyHtml: child.data.selftext_html,
          upvotes: child.data.ups,
          downvotes: child.data.downs,
        }));
        this.logger.info(`Found ${subredditPosts.length} post(s) in /r/${subreddit}`);
        allPosts.push(...subredditPosts);
      } catch (error: any) {
        this.logger.error(`Error fetching /r/${subreddit}:`, error.message);
      }
    }
    return allPosts;
  }

  async storeRedditJobPosts(posts: any[]): Promise<any[]> {
    const newJobs = [];
    let skippedCount = 0;
    this.logger.info(`Processing ${posts.length} Reddit post(s) for jobs table`);
    const subscriptions = await this.db.subscription.findMany();
    for (const post of posts) {
      try {
        const jobInput = {
          title: post.title,
          company: '',
          author: post.author,
          location: '',
          url: post.url,
          postedAt: post.postedAt,
          description: post.body || '',
          isRemote: null,
          tags: [post.subreddit],
          metadata: {
            subreddit: post.subreddit,
            bodyHtml: post.bodyHtml || '',
            upvotes: post.upvotes ? String(post.upvotes) : '0',
            downvotes: post.downvotes ? String(post.downvotes) : '0',
          },
          // flattened source fields
          source: 'reddit',
          externalId: post.url,
          data: post,
        } as any;
        // Check if job already exists - if so, skip it but continue processing others
        const exists = await this.jobService.jobExists(post.url);
        if (exists) {
          skippedCount++;
          continue;
        }
        const upsertedJob = await this.jobService.upsertJob(jobInput);
        // Send notifications for new jobs
        const notificationPayload: NotificationPayload = {
          title: `${post.title} (${post.subreddit})`,
          body: `Posted by /u/${post.author}`,
          url: post.url,
          icon: 'https://new.codebuilder.org/images/logo2.png',
          badge: 'https://new.codebuilder.org/images/logo2.png',
        };
        const notificationPromises = subscriptions.map((sub) =>
          this.notificationsService.sendNotification(sub, notificationPayload)
        );
        await Promise.all(notificationPromises);
        this.logger.info(`Stored new job [${post.url}] from /u/${post.author}`);
        newJobs.push(upsertedJob);
      } catch (error: any) {
        this.logger.error(`Error processing Reddit post ${post.url}:`, error);
      }
    }

    this.logger.info(
      `Reddit jobs processed: ${posts.length} fetched, ${skippedCount} skipped (existing), ${newJobs.length} added`
    );

    return newJobs;
  }
}
