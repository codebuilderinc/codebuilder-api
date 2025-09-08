import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class GoogleAuthInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @IsIn(['development', 'production'])
  buildType?: string;
}
