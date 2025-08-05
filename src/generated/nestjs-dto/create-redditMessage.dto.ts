
import {Prisma} from '@prisma/client'




export class CreateRedditMessageDto {
  redditId: string;
type: string;
author: string;
content: string;
bodyHtml?: string;
subreddit?: string;
contextUrl?: string;
parentId?: string;
messageType?: string;
rawData?: Prisma.InputJsonValue;
createdAt: Date;
}
