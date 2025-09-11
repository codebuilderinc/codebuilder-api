import { IsString, IsIn, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @IsString()
  @IsIn(['web', 'fcm'])
  @ApiProperty({ enum: ['web', 'fcm'], description: 'Subscription type source', example: 'web' })
  type!: 'web' | 'fcm';

  @IsString()
  @ApiProperty({
    description: 'Push endpoint URL provided by the browser or FCM',
    example: 'https://fcm.googleapis.com/fcm/send/abc123',
  })
  endpoint!: string;

  @IsObject()
  @ApiProperty({ description: 'Keys object containing auth and p256dh (for Web Push)' })
  keys!: Record<string, any>;
}
