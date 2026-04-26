import {Controller, Get, Param, ParseIntPipe, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Api} from '@/common/decorators/api.decorator';
import {DatabaseService} from '../../common/database/database.service';
import {PaginationArgs} from '../../common/pagination/pagination.args';
import {buildPaginatedResult} from '../../common/pagination/pagination.util';
import {NotFoundException} from '@nestjs/common';

@ApiTags('reddit')
@Controller('reddit/posts')
export class PostsController {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Returns a paginated list of Reddit posts stored in the database.
   */
  @Get()
  @Api({
    summary: 'List Reddit posts',
    description: 'Returns a paginated list of Reddit posts stored in the database.',
    queriesFrom: PaginationArgs,
    envelope: true,
    responses: [{status: 200, description: 'Posts retrieved successfully.'}],
  })
  async findAll(@Query() paginationArgs: PaginationArgs, @Query('subreddit') subreddit?: string) {
    const where: any = {};
    if (subreddit) {
      where.subreddit = {contains: subreddit, mode: 'insensitive'};
    }

    const take = paginationArgs.first ? Number(paginationArgs.first) : 20;
    const skip = paginationArgs.skip ? Number(paginationArgs.skip) : 0;

    const [posts, totalCount] = await Promise.all([
      this.db.redditPost.findMany({where, orderBy: {postedAt: 'desc'}, skip, take}),
      this.db.redditPost.count({where}),
    ]);

    return buildPaginatedResult({items: posts, skip, take, totalCount, meta: null});
  }

  /**
   * Returns a single Reddit post by its database ID.
   */
  @Get(':id')
  @Api({
    summary: 'Get Reddit post by ID',
    description: 'Returns a single Reddit post stored in the database.',
    responses: [
      {status: 200, description: 'Post retrieved successfully.'},
      {status: 404, description: 'Post not found.'},
    ],
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const post = await this.db.redditPost.findUnique({where: {id}});
    if (!post) {
      throw new NotFoundException(`Reddit post with ID ${id} not found`);
    }
    return post;
  }
}
