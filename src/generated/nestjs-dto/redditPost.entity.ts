



export class RedditPost {
  id: number ;
title: string ;
author: string ;
subreddit: string ;
url: string ;
type: string ;
body: string  | null;
bodyHtml: string  | null;
upvotes: number ;
downvotes: number ;
createdAt: Date ;
postedAt: Date ;
}
