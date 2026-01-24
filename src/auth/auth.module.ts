import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PasswordService } from './password.service';
import { GqlAuthGuard } from './gql-auth.guard';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { AuthController } from './auth.controller';
//import { JwtStrategy } from './jwt.strategy';
import { SecurityConfig } from '../common/configs/config.interface';
import { RedisModule } from '../common/redis/redis.module';
import { ConfigModule } from '../common/configs/config.module';
import { ConfigService } from '../common/configs/config.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    RedisModule.forRoot(),
    ConfigModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        return {
          secret: process.env.JWT_ACCESS_SECRET || 'nestjsPrismaAccessSecret',
          // jsonwebtoken types may require a specific StringValue type; cast to any to satisfy types
          signOptions: {
            expiresIn: (process.env.JWT_EXPIRATION_TIME || '60m') as any,
          },
        } as any;
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, AuthResolver, GqlAuthGuard, PasswordService], //JwtStrategy
  controllers: [AuthController],
  exports: [GqlAuthGuard],
})
export class AuthModule {}
