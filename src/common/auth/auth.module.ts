import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { PasswordService } from './password.service';
import { GqlAuthGuard } from './gql-auth.guard';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
//import { JwtStrategy } from './jwt.strategy';
import { SecurityConfig } from './../configs/config.interface';
import { RedisModule } from './../redis/redis.module';
@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        RedisModule.forRoot(),
        JwtModule.registerAsync({
            useFactory: (configService: ConfigService) => {
                const securityConfig = configService.get<SecurityConfig>('security');
                return {
                    secret: configService.get<string>('JWT_ACCESS_SECRET'),
                    signOptions: {
                        expiresIn: securityConfig.expiresIn,
                    },
                };
            },
            inject: [ConfigService],
        }),
    ],
    providers: [AuthService, AuthResolver, GqlAuthGuard, PasswordService], //JwtStrategy
    exports: [GqlAuthGuard],
})
export class AuthModule {}
