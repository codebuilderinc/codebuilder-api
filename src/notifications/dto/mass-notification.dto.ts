import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MassNotificationDto {
  @IsString()
  @ApiProperty({ description: 'Notification title', example: 'System Update' })
  title!: string;

  @IsString()
  @ApiProperty({ description: 'Notification body text', example: 'We have shipped a new feature.' })
  body!: string;

  @IsString()
  @IsUrl({ require_protocol: true }, { message: 'url must include protocol (https://...)' })
  @ApiProperty({
    description: 'URL to open when the notification is clicked',
    example: 'https://codebuilder.org/dashboard',
  })
  url!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Icon URL', example: 'https://codebuilder.org/icon.png' })
  icon?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Badge URL', example: 'https://codebuilder.org/badge.png' })
  badge?: string;
}
