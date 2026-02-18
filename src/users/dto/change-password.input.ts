import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordInput {
  @ApiProperty({ description: 'Current password', minLength: 8 })
  @IsNotEmpty()
  @MinLength(8)
  oldPassword: string;

  @ApiProperty({ description: 'New password', minLength: 8 })
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
