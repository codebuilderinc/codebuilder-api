import { PrismaService } from 'nestjs-prisma';
import { Prisma, User } from '@prisma/client';
import { Injectable, NotFoundException, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from './password.service';
import { SignupInput } from './dto/signup.input';
import { Token } from './models/token.model';
import { SecurityConfig } from './../configs/config.interface';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        private readonly passwordService: PasswordService,
        private readonly configService: ConfigService
    ) {}

    async createUser(payload: SignupInput): Promise<Token> {
        const hashedPassword = await this.passwordService.hashPassword(payload.password);

        try {
            const user = await this.prisma.user.create({
                data: {
                    ...payload,
                    role: 'USER',
                },
            });

            return this.generateTokens({
                userId: user.id,
            });
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                throw new ConflictException(`Email ${payload.email} already used.`);
            }
            throw new Error(e);
        }
    }

    async login(wallet: string, password: string): Promise<Token> {
        console.log('login');
        const user = await this.prisma.user.findUnique({ where: { wallet } });

        if (!user) {
            throw new NotFoundException(`No user found for email: ${wallet}`);
        }

        const passwordValid = await this.passwordService.validatePassword(password, 'password login disabled');

        if (!passwordValid) {
            throw new BadRequestException('Invalid password');
        }

        return this.generateTokens({
            userId: user.id,
        });
    }

    validateUser(userId: number): Promise<User> {
        return this.prisma.user.findUnique({ where: { id: userId } });
    }

    getUserFromToken(token: string): Promise<User> {
        const id = this.jwtService.decode(token)['userId'];
        return this.prisma.user.findUnique({ where: { id } });
    }

    generateTokens(payload: { userId: number }): Token {
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload),
        };
    }

    private generateAccessToken(payload: { userId: number }): string {
        return this.jwtService.sign(payload);
    }

    private generateRefreshToken(payload: { userId: number }): string {
        const securityConfig = this.configService.get<SecurityConfig>('security');
        return this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: securityConfig.refreshIn,
        });
    }

    refreshToken(token: string) {
        try {
            const { userId } = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });

            return this.generateTokens({
                userId,
            });
        } catch (e) {
            throw new UnauthorizedException();
        }
    }
}
