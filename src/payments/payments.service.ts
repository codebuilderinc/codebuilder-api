import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PaymentMethod, PaymentProvider, PaymentStatus, Prisma } from '@prisma/client';
import StripeSdk from 'stripe';
import { ConfigService } from '../common/configs/config.service';
import { DatabaseService } from '../common/database/database.service';
import { CreateStripePaymentIntentDto } from './dto/create-stripe-payment-intent.dto';
import { FinalizeStripePaymentDto } from './dto/finalize-stripe-payment.dto';

type StripePaymentIntentRecord = Awaited<ReturnType<StripeSdk['paymentIntents']['retrieve']>>;

@Injectable()
export class PaymentsService {
  private stripeClient: StripeSdk | null = null;

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService
  ) {}

  getStripePublicConfig() {
    const publishableKey = this.configService.get('STRIPE_PUBLISHABLE_KEY')?.trim() || null;
    const currency = (this.configService.get('STRIPE_DEFAULT_CURRENCY') || 'usd').toUpperCase();
    return { publishableKey, configured: Boolean(publishableKey), currency };
  }

  async createStripeIntent(dto: CreateStripePaymentIntentDto) {
    const currency = this.normalizeCurrency(dto.currency);

    const paymentAttempt = await this.db.paymentAttempt.create({
      data: {
        invoiceIdentifier: dto.invoiceIdentifier,
        provider: PaymentProvider.STRIPE,
        method: PaymentMethod.CREDIT_CARD,
        selection: dto.paymentSelection,
        status: PaymentStatus.INITIATED,
        currency,
        amountCents: dto.amountCents,
        invoiceTotalCents: dto.invoiceTotalCents,
        invoiceBalanceCents: dto.invoiceBalanceCents,
        clientName: dto.clientName,
        clientFirm: dto.clientFirm,
        clientAddress: dto.clientAddress,
        requestPayload: this.toJson(dto),
        invoiceSnapshot: this.toJson(dto.invoiceSnapshot),
      },
    });

    try {
      this.validateRequestedAmount(dto);

      const stripe = this.getStripeClient();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: dto.amountCents,
        currency: currency.toLowerCase(),
        payment_method_types: ['card'],
        description: `CodeBuilder Invoice ${dto.invoiceIdentifier}`,
        metadata: {
          paymentAttemptId: paymentAttempt.id,
          invoiceIdentifier: dto.invoiceIdentifier,
          paymentSelection: dto.paymentSelection,
        },
      });

      if (!paymentIntent.client_secret) {
        throw new BadRequestException('Stripe did not return a client secret for the payment intent.');
      }

      await this.db.paymentAttempt.update({
        where: { id: paymentAttempt.id },
        data: {
          stripePaymentIntentId: paymentIntent.id,
          status: this.mapStripeStatus(paymentIntent.status, paymentIntent.last_payment_error?.message),
          providerResponse: this.toJson(paymentIntent),
        },
      });

      return {
        paymentAttemptId: paymentAttempt.id,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      await this.markAttemptAsFailed(paymentAttempt.id, error);
      throw this.toHttpException(error);
    }
  }

  async finalizeStripeAttempt(paymentAttemptId: string, dto: FinalizeStripePaymentDto) {
    const paymentAttempt = await this.db.paymentAttempt.findUnique({
      where: { id: paymentAttemptId },
    });

    if (!paymentAttempt) {
      throw new NotFoundException('Payment attempt not found.');
    }

    const paymentIntentId = dto.paymentIntentId || paymentAttempt.stripePaymentIntentId;

    if (!paymentIntentId) {
      if (!dto.errorMessage && !dto.errorCode) {
        throw new BadRequestException('No Stripe payment intent was provided for finalization.');
      }

      const updatedAttempt = await this.db.paymentAttempt.update({
        where: { id: paymentAttempt.id },
        data: {
          status: PaymentStatus.FAILED,
          failureCode: dto.errorCode ?? null,
          failureMessage: dto.errorMessage ?? null,
          providerResponse: this.toJson({
            source: 'client',
            errorCode: dto.errorCode,
            errorMessage: dto.errorMessage,
            errorType: dto.errorType,
          }),
          finalizedAt: new Date(),
        },
      });

      return {
        paymentAttempt: updatedAttempt,
      };
    }

    try {
      const stripe = this.getStripeClient();
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['latest_charge', 'payment_method'],
      });

      const paymentMethod = this.unwrapPaymentMethod(paymentIntent);
      const latestCharge = this.unwrapLatestCharge(paymentIntent);
      const failureCode = paymentIntent.last_payment_error?.code ?? dto.errorCode ?? null;
      const failureMessage = paymentIntent.last_payment_error?.message ?? dto.errorMessage ?? null;
      const status = this.mapStripeStatus(paymentIntent.status, failureMessage ?? undefined);

      const updatedAttempt = await this.db.paymentAttempt.update({
        where: { id: paymentAttempt.id },
        data: {
          stripePaymentIntentId: paymentIntent.id,
          stripePaymentMethodId:
            paymentMethod?.id ?? (typeof paymentIntent.payment_method === 'string' ? paymentIntent.payment_method : null),
          stripeChargeId: latestCharge?.id ?? null,
          receiptUrl: this.getReceiptUrl(latestCharge),
          cardBrand: paymentMethod?.card?.brand ?? null,
          cardLast4: paymentMethod?.card?.last4 ?? null,
          billingPostalCode: paymentMethod?.billing_details?.address?.postal_code ?? null,
          status,
          failureCode: status === PaymentStatus.FAILED ? failureCode : null,
          failureMessage: status === PaymentStatus.FAILED ? failureMessage : null,
          providerResponse: this.toJson(paymentIntent),
          finalizedAt: new Date(),
        },
      });

      return {
        paymentAttempt: updatedAttempt,
      };
    } catch (error) {
      await this.markAttemptAsFailed(paymentAttempt.id, error);
      throw this.toHttpException(error);
    }
  }

  private getStripeClient() {
    const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY')?.trim();

    if (!stripeSecretKey) {
      throw new ServiceUnavailableException('Stripe is not configured yet. Add STRIPE_SECRET_KEY to the API environment.');
    }

    if (!this.stripeClient) {
      this.stripeClient = new StripeSdk(stripeSecretKey);
    }

    return this.stripeClient;
  }

  private normalizeCurrency(currency: string) {
    return (currency || this.configService.get('STRIPE_DEFAULT_CURRENCY') || 'usd').toUpperCase();
  }

  private validateRequestedAmount(dto: CreateStripePaymentIntentDto) {
    if (dto.amountCents <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }

    if (dto.amountCents > dto.invoiceBalanceCents) {
      throw new BadRequestException('Payment amount cannot exceed the remaining invoice balance.');
    }
  }

  private mapStripeStatus(status: StripeSdk.PaymentIntent.Status, failureMessage?: string | null): PaymentStatus {
    switch (status) {
      case 'succeeded':
        return PaymentStatus.SUCCEEDED;
      case 'processing':
      case 'requires_capture':
        return PaymentStatus.PROCESSING;
      case 'requires_action':
        return PaymentStatus.REQUIRES_ACTION;
      case 'canceled':
        return PaymentStatus.CANCELED;
      case 'requires_payment_method':
        return failureMessage ? PaymentStatus.FAILED : PaymentStatus.INITIATED;
      case 'requires_confirmation':
      default:
        return PaymentStatus.INITIATED;
    }
  }

  private unwrapPaymentMethod(paymentIntent: StripePaymentIntentRecord) {
    if (!paymentIntent.payment_method || typeof paymentIntent.payment_method === 'string') {
      return null;
    }

    return paymentIntent.payment_method;
  }

  private unwrapLatestCharge(paymentIntent: StripePaymentIntentRecord) {
    if (!paymentIntent.latest_charge || typeof paymentIntent.latest_charge === 'string') {
      return null;
    }

    return paymentIntent.latest_charge;
  }

  private getReceiptUrl(charge: StripeSdk.Charge | null) {
    if (!charge || !('receipt_url' in charge)) {
      return null;
    }

    return charge.receipt_url ?? null;
  }

  private toJson(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return Prisma.JsonNull;
    }

    const snapshot = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;

    if ('client_secret' in snapshot) {
      delete snapshot.client_secret;
    }

    return snapshot as Prisma.InputJsonValue;
  }

  private async markAttemptAsFailed(paymentAttemptId: string, error: unknown) {
    const failureCode = this.extractErrorCode(error);
    const failureMessage = this.extractErrorMessage(error);

    await this.db.paymentAttempt.update({
      where: { id: paymentAttemptId },
      data: {
        status: PaymentStatus.FAILED,
        failureCode,
        failureMessage,
        providerResponse: this.toJson({
          source: 'server',
          code: failureCode,
          message: failureMessage,
        }),
        finalizedAt: new Date(),
      },
    });
  }

  private extractErrorCode(error: unknown) {
    if (typeof error === 'object' && error && 'code' in error && typeof (error as { code?: unknown }).code === 'string') {
      return (error as { code: string }).code;
    }

    return null;
  }

  private extractErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Stripe payment request failed.';
  }

  private toHttpException(error: unknown) {
    if (error instanceof BadRequestException || error instanceof ServiceUnavailableException) {
      return error;
    }

    return new BadRequestException(this.extractErrorMessage(error));
  }
}
