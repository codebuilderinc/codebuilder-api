import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { PasswordService } from '../common/auth/password.service';
import { UserController } from './user.controller';
import { AuthModule } from '../common/auth/auth.module';
import { ConfigService } from './../common/configs/config.service';
import { RedisModule } from '../common/redis/redis.module';

@Module({
    imports: [AuthModule, RedisModule.forRoot()],
    controllers: [UserController],
    providers: [UserResolver, UserService, PasswordService],
    exports: [UserService],
})
export class UserModule {}
