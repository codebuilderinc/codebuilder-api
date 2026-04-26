





export class CreateRedditPostDto {
  title: string;
author: string;
subreddit: string;
url: string;
body?: string;
bodyHtml?: string;
postedAt: Date;
}
