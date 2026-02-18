import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PasswordService } from '../auth/password.service';
import { UserController } from './user.controller';
import { AuthModule } from '../auth/auth.module';
import { ConfigService } from './../common/configs/config.service';
import { RedisModule } from '../common/redis/redis.module';

@Module({
  imports: [AuthModule, RedisModule.forRoot()],
  controllers: [UserController],
  providers: [UserService, PasswordService],
  exports: [UserService],
})
export class UserModule {}
