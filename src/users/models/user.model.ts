import { ObjectType, registerEnumType, HideField, Field } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';
import { BaseModel } from '../../common/models/base.model';
import { Role } from '@prisma/client';

registerEnumType(Role, {
  name: 'Role',
  description: 'User role',
});

@ObjectType()
export class User extends BaseModel {
  //@Field()
  //@IsEmail()
  //email: string;

  @Field(() => Role)
  role: Role;

  // @Field(() => [Position], { nullable: true })
  // positions?: [Position] | null;

  // @Field(() => [Swap], { nullable: true })
  // swaps?: [Swap] | null;

  @HideField()
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
