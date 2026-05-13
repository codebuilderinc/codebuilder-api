import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/models/user.model';

export class Auth {
  @ApiProperty({ type: User })
  user: User;

  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken: string;
}
