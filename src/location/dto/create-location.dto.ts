import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * DTO for creating a Location record based on the frontend /api/location endpoint.
 * The frontend sends flat fields (not nested coords/address objects) plus a `subscriptionId`
 * which corresponds to a push subscription token (stored inside `Subscription.keys` JSON).
 */
export class CreateLocationDto {
  @ApiProperty({ description: 'Subscription token (maps to Subscription.keys.token)', example: 'fcm-token-123' })
  @IsString()
  subscriptionId!: string;

  // Coordinates -------------------------------------------------------------
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() accuracy?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() altitude?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() altitudeAccuracy?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() heading?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() latitude?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() longitude?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() speed?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() mocked?: boolean;
  @ApiProperty({ required: false, description: 'Original client timestamp (ms since epoch)' })
  @IsOptional()
  @IsNumber()
  timestamp?: number;

  // Address -----------------------------------------------------------------
  @ApiProperty({ required: false }) @IsOptional() @IsString() city?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() country?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() district?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() formattedAddress?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() isoCountryCode?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() postalCode?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() region?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() street?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() streetNumber?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() subregion?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() timezone?: string;
}
