import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FinalizeStripePaymentDto {
  @ApiProperty({ required: false, example: 'pi_3RExample123456789' })
  @IsOptional()
  @IsString()
  paymentIntentId?: string;

  @ApiProperty({ required: false, example: 'card_declined' })
  @IsOptional()
  @IsString()
  errorCode?: string;

  @ApiProperty({ required: false, example: 'Your card was declined.' })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiProperty({ required: false, example: 'card_error' })
  @IsOptional()
  @IsString()
  errorType?: string;
}
