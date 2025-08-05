
import {Prisma} from '@prisma/client'


export class RedditMessage {
  id: number ;
redditId: string ;
type: string ;
author: string ;
content: string ;
bodyHtml: string  | null;
subreddit: string  | null;
contextUrl: string  | null;
parentId: string  | null;
messageType: string  | null;
isRead: boolean ;
isSubredditModMail: boolean ;
isInternal: boolean ;
rawData: Prisma.JsonValue  | null;
createdAt: Date ;
receivedAt: Date ;
}
