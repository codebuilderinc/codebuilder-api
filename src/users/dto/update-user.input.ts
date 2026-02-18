import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserInput {
  @ApiPropertyOptional({ description: 'User first name' })
  @IsOptional()
  @IsString()
  firstname?: string;

  @ApiPropertyOptional({ description: 'User last name' })
  @IsOptional()
  @IsString()
  lastname?: string;
}
