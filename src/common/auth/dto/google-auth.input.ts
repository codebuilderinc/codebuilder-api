import { IsNotEmpty, IsString } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class GoogleAuthInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
