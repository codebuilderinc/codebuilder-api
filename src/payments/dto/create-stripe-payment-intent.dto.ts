import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateStripePaymentIntentDto {
  @ApiProperty({ example: 'CB-2024-117' })
  @IsString()
  invoiceIdentifier!: string;

  @ApiProperty({ enum: ['FULL', 'PARTIAL'], example: 'FULL' })
  @IsString()
  paymentSelection!: 'FULL' | 'PARTIAL';

  @ApiProperty({ description: 'Requested payment amount in cents', example: 268000 })
  @IsInt()
  @Min(1)
  amountCents!: number;

  @ApiProperty({ description: 'Invoice total amount in cents', example: 418000 })
  @IsInt()
  @Min(1)
  invoiceTotalCents!: number;

  @ApiProperty({ description: 'Invoice remaining balance in cents', example: 268000 })
  @IsInt()
  @Min(1)
  invoiceBalanceCents!: number;

  @ApiProperty({ example: 'USD', default: 'USD' })
  @IsString()
  currency!: string;

  @ApiProperty({ example: 'ACME Product Team' })
  @IsString()
  clientName!: string;

  @ApiProperty({ required: false, example: 'ACME Labs LLC' })
  @IsOptional()
  @IsString()
  clientFirm?: string;

  @ApiProperty({ required: false, example: '47 River Road, Austin, TX 78701' })
  @IsOptional()
  @IsString()
  clientAddress?: string;

  @ApiProperty({ required: false, type: Object, description: 'Serialized snapshot of the invoice shown to the payer.' })
  @IsOptional()
  @IsObject()
  invoiceSnapshot?: Record<string, unknown>;
}
