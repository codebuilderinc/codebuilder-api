import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthUser, RedisAuthGuard } from '../auth/redis-auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { Api } from '../common/decorators/api.decorator';

@Controller()
@ApiTags('users')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(RedisAuthGuard)
  @Get('/wallet/:token/sell')
  @Api({ summary: 'Example secured endpoint', description: 'Placeholder user wallet endpoint.', envelope: true })
  walletTokenSell(@Param('token') token: string) {
    return { message: 'Not yet implemented' };
  }
}
