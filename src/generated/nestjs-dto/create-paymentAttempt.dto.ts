
import {Prisma,PaymentProvider,PaymentMethod,PaymentSelection} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'




export class CreatePaymentAttemptDto {
  invoiceIdentifier: string;
@ApiProperty({ enum: PaymentProvider})
provider: PaymentProvider;
@ApiProperty({ enum: PaymentMethod})
method: PaymentMethod;
@ApiProperty({ enum: PaymentSelection})
selection: PaymentSelection;
amountCents: number;
invoiceTotalCents: number;
invoiceBalanceCents: number;
clientName?: string;
clientFirm?: string;
clientAddress?: string;
stripePaymentIntentId?: string;
stripePaymentMethodId?: string;
stripeChargeId?: string;
receiptUrl?: string;
cardBrand?: string;
cardLast4?: string;
billingPostalCode?: string;
failureCode?: string;
failureMessage?: string;
requestPayload?: Prisma.InputJsonValue;
invoiceSnapshot?: Prisma.InputJsonValue;
providerResponse?: Prisma.InputJsonValue;
finalizedAt?: Date;
}
