import { PrismaService } from 'nestjs-prisma';
import { Injectable, BadRequestException } from '@nestjs/common';
import { PasswordService } from './../common/auth/password.service';
import { ChangePasswordInput } from './dto/change-password.input';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        private passwordService: PasswordService
    ) {}

    updateUser(userId: number, newUserData: UpdateUserInput) {
        return this.prisma.user.update({
            data: newUserData,
            where: {
                id: userId,
            },
        });
    }

    async changePassword(userId: number, userPassword: string, changePassword: ChangePasswordInput) {
        const passwordValid = await this.passwordService.validatePassword(changePassword.oldPassword, userPassword);

        if (!passwordValid) {
            throw new BadRequestException('Invalid password');
        }

        const hashedPassword = await this.passwordService.hashPassword(changePassword.newPassword);

        return this.prisma.user.update({
            data: {},
            where: { id: userId },
        });
    }
}
