import { Body, Controller, Delete, Get, Param, Put, Query, UseFilters, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { User } from '@prisma/client';
import { ConfigService } from './../common/configs/config.service';
import { PaginationQuery } from '../common/database/pagination/pagination-query.model';
import { PaginationInterceptor } from '../common/database/pagination/pagination.interceptor';
import { ExceptionsLoggerFilter } from '../common/utils/exceptions-logger.exception-filter';
import { UserService } from './user.service';
import { AuthUser, RedisAuthGuard } from './../common/auth/redis-auth.guard';

@Controller()
@UsePipes(ValidationPipe)
@UseFilters(ExceptionsLoggerFilter)
export class UserController {
    constructor(
        private userService: UserService,
        private configService: ConfigService
    ) {}

    @UseGuards(RedisAuthGuard)
    @UseInterceptors(PaginationInterceptor)
    @Get('/wallet/:token/sell')
    walletTokenSell(@Param('username') username: string, @Query('pagination') pagination: PaginationQuery, @AuthUser() user: User) {
        return user.wallet;
        //return this.userService.getSocialUserPosts(username, pagination);
    }
}
