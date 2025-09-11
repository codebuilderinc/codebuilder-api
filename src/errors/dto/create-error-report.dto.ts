import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ErrorOptionsDto {
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isFatal?: boolean;
  @ApiProperty({ required: false, description: 'React Error Boundary info object' })
  @IsOptional()
  @IsObject()
  errorInfo?: any;
}

export class CreateErrorReportDto {
  @ApiProperty({ description: 'Error message', example: 'TypeError: Cannot read properties of undefined' })
  @IsString()
  message!: string;

  @ApiProperty({ required: false, description: 'Stack trace' })
  @IsOptional()
  @IsString()
  stack?: string;

  @ApiProperty({ required: false, description: 'Client platform (web, android, ios, etc.)' })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiProperty({ required: false, type: () => ErrorOptionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ErrorOptionsDto)
  options?: ErrorOptionsDto;
}
