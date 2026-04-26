import {Controller, Get, Param, ParseIntPipe, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Api} from '@/common/decorators/api.decorator';
import {MessagesService} from './messages.service';
import {RedditService} from '../reddit.service';
import {PaginationArgs} from '../../common/pagination/pagination.args';

@ApiTags('reddit')
@Controller('reddit/messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly redditService: RedditService
  ) {}

  /**
   * Returns a paginated table of all Reddit messages stored in the database.
   */
  @Get()
  @Api({
    summary: 'List Reddit messages',
    description: 'Returns a paginated list of Reddit messages (DMs, comments) stored in the database.',
    queriesFrom: PaginationArgs,
    envelope: true,
    responses: [
      {status: 200, description: 'Messages retrieved successfully.'},
    ],
  })
  async findAll(
    @Query() paginationArgs: PaginationArgs,
    @Query('isRead') isRead?: string,
    @Query('type') type?: string,
    @Query('subreddit') subreddit?: string
  ) {
    const filter: {isRead?: boolean; type?: string; subreddit?: string} = {};
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (type) filter.type = type;
    if (subreddit) filter.subreddit = subreddit;
    return this.messagesService.findAll(paginationArgs, filter);
  }

  /**
   * Triggers a Reddit inbox check and stores any new messages in the database.
   */
  @Get('check')
  @Api({
    summary: 'Check Reddit inbox for new messages',
    description: 'Connects to Reddit, fetches inbox messages and stores any new ones in the database.',
    envelope: true,
    responses: [
      {status: 200, description: 'Inbox checked and new messages stored.'},
    ],
  })
  async checkInbox() {
    const newMessages = await this.redditService.checkRedditMessages();
    return {count: newMessages.length, messages: newMessages};
  }

  /**
   * Returns a single Reddit message by ID.
   */
  @Get(':id')
  @Api({
    summary: 'Get Reddit message by ID',
    description: 'Returns a single Reddit message stored in the database.',
    responses: [
      {status: 200, description: 'Message retrieved successfully.'},
      {status: 404, description: 'Message not found.'},
    ],
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.messagesService.findOne(id);
  }

  /**
   * Marks a Reddit message as read.
   */
  @Put(':id/read')
  @Api({
    summary: 'Mark message as read',
    description: 'Marks a Reddit message as read in the database.',
    responses: [
      {status: 200, description: 'Message marked as read.'},
      {status: 404, description: 'Message not found.'},
    ],
  })
  async markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.messagesService.markAsRead(id);
  }
}
