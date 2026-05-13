import { IsJWT, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenInput {
  @ApiProperty({ description: 'JWT refresh token' })
  @IsNotEmpty()
  @IsJWT()
  token: string;
}
