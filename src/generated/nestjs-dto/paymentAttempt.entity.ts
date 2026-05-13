
import {Prisma,PaymentProvider,PaymentMethod,PaymentSelection,PaymentStatus} from '@prisma/client'


export class PaymentAttempt {
  id: string ;
invoiceIdentifier: string ;
provider: PaymentProvider ;
method: PaymentMethod ;
selection: PaymentSelection ;
status: PaymentStatus ;
currency: string ;
amountCents: number ;
invoiceTotalCents: number ;
invoiceBalanceCents: number ;
clientName: string  | null;
clientFirm: string  | null;
clientAddress: string  | null;
stripePaymentIntentId: string  | null;
stripePaymentMethodId: string  | null;
stripeChargeId: string  | null;
receiptUrl: string  | null;
cardBrand: string  | null;
cardLast4: string  | null;
billingPostalCode: string  | null;
failureCode: string  | null;
failureMessage: string  | null;
requestPayload: Prisma.JsonValue  | null;
invoiceSnapshot: Prisma.JsonValue  | null;
providerResponse: Prisma.JsonValue  | null;
finalizedAt: Date  | null;
createdAt: Date ;
updatedAt: Date ;
}
