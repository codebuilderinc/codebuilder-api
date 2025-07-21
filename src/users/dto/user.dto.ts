import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  Contains,
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Match } from './../../common/validation/match.decorator';
import { USER_APIs_ERROR } from './../models/validation-errors';

export class UserDTO {
  @IsString()
  @MinLength(1)
  name: string;

  @IsUrl()
  image: string;
}

export class UpdateUserDTO {
  @IsOptional()
  @ValidateIf((o) => o.description > 0)
  @Length(3, 255)
  description: string;

  @IsOptional()
  @IsNotEmpty()
  @IsUrl()
  @Contains('nyc3.digitaloceanspaces.com')
  profileImageUrl: string;

  @IsOptional()
  @IsNotEmpty()
  @IsUrl()
  @Contains('nyc3.digitaloceanspaces.com')
  bannerImageUrl: string;

  @IsOptional()
  @IsNotEmpty()
  @Length(1, 50)
  twitter: string;
}

export class RegisterUserDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @ValidUserName()
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  @Match('password', { message: USER_APIs_ERROR.USER_PASSWORD_MISMATCH })
  passwordConfirmation: string;
}

export class LoginUserDTO {
  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDTO {
  @IsNotEmpty()
  @IsString()
  accessToken: string;

  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class RefreshTokenUpdateDTO extends RefreshTokenDTO {
  @IsNotEmpty()
  @IsBoolean()
  isValid: boolean;
}

/**
 * Custom decorator for the valid username
 * @returns Combination of decorators
 */

function ValidUserName() {
  const validUsernameRegex = new RegExp(
    /^(?=.{3,25}$)(?:[a-zA-Z\d]+(?:(?:\.|-|_)[a-zA-Z\d])*)+$/,
  );

  return applyDecorators(
    IsNotEmpty(),
    IsString(),
    Length(3, 25),
    Matches(validUsernameRegex, {
      message: USER_APIs_ERROR.USER_INVALID_USERNAME,
    }),
  );
}

export class CheckUsernameDTO {
  @ValidUserName()
  username: string;
}

export class RegisterWalletDTO {
  @IsString()
  walletAddress: string;

  @IsString()
  networkId: string;

  @IsString()
  signature: string;
}
