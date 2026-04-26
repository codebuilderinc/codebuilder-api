import {Injectable, NotFoundException} from '@nestjs/common';
import {DatabaseService} from '../../common/database/database.service';
import {PaginationArgs} from '../../common/pagination/pagination.args';
import {buildPaginatedResult} from '../../common/pagination/pagination.util';

@Injectable()
export class MessagesService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Returns a paginated list of Reddit messages stored in the database.
   */
  async findAll(paginationArgs: PaginationArgs, filter?: {isRead?: boolean; type?: string; subreddit?: string}) {
    const where: any = {};

    if (filter?.isRead !== undefined) {
      where.isRead = filter.isRead;
    }
    if (filter?.type) {
      where.type = filter.type;
    }
    if (filter?.subreddit) {
      where.subreddit = {contains: filter.subreddit, mode: 'insensitive'};
    }

    const take = paginationArgs.first ? Number(paginationArgs.first) : 20;
    const skip = paginationArgs.skip ? Number(paginationArgs.skip) : 0;

    const [messages, totalCount] = await Promise.all([
      this.db.redditMessage.findMany({
        where,
        orderBy: {createdAt: 'desc'},
        skip,
        take,
      }),
      this.db.redditMessage.count({where}),
    ]);

    return buildPaginatedResult({items: messages, skip, take, totalCount, meta: null});
  }

  /**
   * Returns a single Reddit message by its database ID.
   */
  async findOne(id: number) {
    const message = await this.db.redditMessage.findUnique({where: {id}});
    if (!message) {
      throw new NotFoundException(`Reddit message with ID ${id} not found`);
    }
    return message;
  }

  /**
   * Marks a Reddit message as read.
   */
  async markAsRead(id: number) {
    await this.findOne(id);
    return this.db.redditMessage.update({
      where: {id},
      data: {isRead: true},
    });
  }
}
