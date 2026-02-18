import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { BaseModel } from '../../common/models/base.model';
import { Role } from '@prisma/client';

export class User extends BaseModel {
  @ApiProperty({ enum: Role, description: 'User role' })
  role: Role;

  @ApiHideProperty()
  password: string;
}

interface UserWalletsBase {
  walletAddress: string;
  userId: bigint;
  networkId: string;
}

export interface GetUserByUsername {
  id: bigint;
  email: string;
  image: string;
  username: string;
  description: string;
  country: string;
  profileImageUrl: string;
  bannerImageUrl: string;
  twitter: string;
  wallets: UserWalletsBase[];
  createdOn: Date;
}
