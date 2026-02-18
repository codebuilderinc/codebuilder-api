import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleAuthInput {
  @ApiProperty({ description: 'Google ID token' })
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @ApiPropertyOptional({ description: 'Build type', enum: ['development', 'production'] })
  @IsString()
  @IsOptional()
  @IsIn(['development', 'production'])
  buildType?: string;
}
