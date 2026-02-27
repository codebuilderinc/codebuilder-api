import {Injectable} from '@nestjs/common';
import {JobService} from '../jobs/job.service';
import {NotificationsService} from '../notifications/notifications.service';
import {NotificationPayload} from '../notifications/interfaces/notification-payload.interface';
import {DatabaseService} from '../common/database/database.service';
import {LoggerService} from '../common/logger/logger.service';
import Snoowrap from 'snoowrap';

/** True when `item` is a PrivateMessage (DM/modmail), false when it is a Comment reply. */
function isPrivateMessage(item: Snoowrap.PrivateMessage | Snoowrap.Comment): item is Snoowrap.PrivateMessage {
  // Reddit's API sets was_comment=true for comment replies, false for DMs/modmail.
  return (item as any).was_comment === false;
}

@Injectable()
export class RedditService {
  private redditClient: Snoowrap | null = null;

  constructor(
    private readonly jobService: JobService,
    private readonly notificationsService: NotificationsService,
    private readonly logger: LoggerService,
    private readonly db: DatabaseService
  ) {}

  private async getRedditClient(): Promise<Snoowrap> {
    if (!this.redditClient) {
      const SnoowrapModule = await import('snoowrap');
      const SnoowrapClass = SnoowrapModule.default ?? (SnoowrapModule as any);
      this.redditClient = new SnoowrapClass({
        userAgent: 'CodeBuilder by /u/taofullstack',
        clientId: process.env.REDDIT_CLIENT_ID,
        clientSecret: process.env.REDDIT_CLIENT_SECRET,
        username: process.env.REDDIT_USERNAME,
        password: process.env.REDDIT_PASSWORD,
      }) as Snoowrap;
    }
    return this.redditClient;
  }

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
        const subredditPosts = response.data.data.children
          .map((child: any) => ({
            title: child.data.title,
            author: child.data.author,
            subreddit: child.data.subreddit,
            url: child.data.url,
            postedAt: new Date(child.data.created_utc * 1000),
            body: child.data.selftext,
            bodyHtml: child.data.selftext_html,
            upvotes: child.data.ups,
            downvotes: child.data.downs,
          }))
          .filter((post: any) => /\[hiring\]/i.test(post.title));
        this.logger.info(`Found ${subredditPosts.length} [HIRING] post(s) in /r/${subreddit}`);
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
          source: 'reddit',
          externalId: post.url,
          data: post,
        } as any;
        const exists = await this.jobService.jobExists(post.url);
        if (exists) {
          skippedCount++;
          continue;
        }
        const upsertedJob = await this.jobService.upsertJob(jobInput);
        const notificationPayload: NotificationPayload = {
          title: `${post.title} (${post.subreddit})`,
          body: `Posted by /u/${post.author}`,
          url: post.url,
          icon: 'https://new.codebuilder.org/images/logo2.png',
          badge: 'https://new.codebuilder.org/images/logo2.png',
        };
        const notificationPromises = subscriptions.map((sub) => this.notificationsService.sendNotification(sub, notificationPayload));
        await Promise.all(notificationPromises);
        this.logger.info(`Stored new job [${post.url}] from /u/${post.author}`);
        newJobs.push(upsertedJob);
      } catch (error: any) {
        this.logger.error(`Error processing Reddit post ${post.url}:`, error);
      }
    }
    this.logger.info(`Reddit jobs processed: ${posts.length} fetched, ${skippedCount} skipped (existing), ${newJobs.length} added`);
    return newJobs;
  }

  /**
   * Checks Reddit inbox for new messages and stores them in the database.
   * Requires REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME and REDDIT_PASSWORD env vars.
   */
  async checkRedditMessages(): Promise<any[]> {
    try {
      const client = await this.getRedditClient();
      const messages = await client.getInbox({filter: 'messages'});
      return await this.storeMessages(messages);
    } catch (error: any) {
      this.logger.error('Error checking Reddit messages:', error.message);
      return [];
    }
  }

  /**
   * Stores an array of Reddit inbox items (PrivateMessage or Comment) in the database,
   * skipping duplicates and sending push notifications for new ones.
   */
  async storeMessages(items: Array<Snoowrap.PrivateMessage | Snoowrap.Comment>): Promise<any[]> {
    const newMessages = [];
    this.logger.info(`Processing ${items.length} message(s)`);
    const subscriptions = await this.db.subscription.findMany();

    for (const item of items) {
      try {
        const isMsg = isPrivateMessage(item);
        const type = isMsg ? 'private_message' : 'comment';

        const existing = await this.db.redditMessage.findUnique({
          where: {redditId: item.name},
        });
        if (existing) {
          continue;
        }

        const createdMsg = await this.db.redditMessage.create({
          data: {
            redditId: item.name,
            type,
            author: item.author?.name ?? '[deleted]',
            content: item.body,
            bodyHtml: item.body_html,
            subreddit: item.subreddit?.display_name,
            createdAt: new Date(item.created_utc * 1000),
            parentId: item.parent_id,
            rawData: typeof item.toJSON === 'function' ? item.toJSON() : (item as any),
            isRead: isMsg ? (item as Snoowrap.PrivateMessage).new === false : false,
            contextUrl: isMsg
              ? (item as Snoowrap.PrivateMessage).context
              : `https://www.reddit.com${(item as Snoowrap.Comment).permalink}`,
          },
        });

        const notificationPayload: NotificationPayload = {
          title: `New ${type} from /u/${createdMsg.author}`,
          body: createdMsg.content,
          url: createdMsg.contextUrl ?? '',
          icon: 'https://new.codebuilder.org/images/logo2.png',
          badge: 'https://new.codebuilder.org/images/logo2.png',
        };
        const notificationPromises = subscriptions.map((sub) => this.notificationsService.sendNotification(sub, notificationPayload));
        await Promise.all(notificationPromises);

        this.logger.info(`Stored new ${type} [${createdMsg.redditId}] from /u/${createdMsg.author}`);
        newMessages.push(createdMsg);
      } catch (error: any) {
        this.logger.error(`Error processing message ${item.name}:`, error.message);
      }
    }
    return newMessages;
  }
}

