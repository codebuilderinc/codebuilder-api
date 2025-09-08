import { Injectable, UnauthorizedException, CanActivate, ExecutionContext, createParamDecorator } from '@nestjs/common';
import { LogService } from '../common/log/log.service';
import { RedisService } from '../common/redis/redis.service';
import { RedisServer } from '../common/redis/redis.decorator';
import { Observable } from 'rxjs';
import { User } from 'src/users/models/user.model';
import { DatabaseService } from '../common/database/database.service';

@Injectable()
export class RedisAuthGuard implements CanActivate {
  constructor(
    @RedisServer('AUTH') private redis: RedisService,
    private readonly logService: LogService,
    private readonly databaseService: DatabaseService
  ) {}

  token = '';

  // canActivate(context: ExecutionContext): Promise<any> {
  //     const request = context.switchToHttp().getRequest();
  //     this.token = request.headers['authorization'].split(' ')[1];

  //     const canActivateResult = await this.canActivate(context);
  //     if (canActivateResult instanceof Observable) {
  //       return canActivateResult.toPromise();
  //     }
  //     return canActivateResult;
  //   }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    const request = context.switchToHttp().getRequest();
    const token = request?.headers['authorization']?.split(' ')[1];
    if (!token) throw new UnauthorizedException();

    try {
      const value = await this.redis.client.get(`A:${token}`);
      if (!value) throw new UnauthorizedException();

      const user = await this.databaseService.user.findUnique({ where: { wallet: value } });
      if (!user) throw new UnauthorizedException();
      request.user = user;
    } catch (e) {
      console.log('error', e);
      throw new UnauthorizedException();
    }

    return true;

    // return this.canActivate(context);
  }

  handleRequest(error: Error, user: User, info: string) {
    if (error) {
      throw error || new UnauthorizedException();
    }
    return user;
  }
}

/* Custom User Param Decorator */

export const AuthUser = createParamDecorator((_, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  return user;
});
