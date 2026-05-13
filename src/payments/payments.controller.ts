import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Api } from '../common/decorators/api.decorator';
import { CreateStripePaymentIntentDto } from './dto/create-stripe-payment-intent.dto';
import { FinalizeStripePaymentDto } from './dto/finalize-stripe-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('stripe/config')
  @HttpCode(HttpStatus.OK)
  @Api({
    summary: 'Get Stripe public config',
    description: 'Returns public Stripe configuration for the frontend (publishable key and default currency).',
    envelope: true,
    responses: [{ status: 200, description: 'Stripe public config.' }],
  })
  getStripeConfig() {
    return this.paymentsService.getStripePublicConfig();
  }

  @Post('stripe/intents')
  @HttpCode(HttpStatus.CREATED)
  @Api({
    summary: 'Create a Stripe payment intent',
    description:
      'Creates a Stripe card payment intent for the invoice modal and records the payment attempt before the customer confirms the card.',
    bodyType: CreateStripePaymentIntentDto,
    envelope: true,
    responses: [
      { status: 201, description: 'Stripe payment intent created.' },
      { status: 400, description: 'Invalid payment request.' },
      { status: 503, description: 'Stripe is not configured.' },
    ],
  })
  async createStripeIntent(@Body() dto: CreateStripePaymentIntentDto) {
    return this.paymentsService.createStripeIntent(dto);
  }

  @Post('stripe/attempts/:id/finalize')
  @HttpCode(HttpStatus.OK)
  @Api({
    summary: 'Finalize a Stripe payment attempt',
    description:
      'Retrieves the Stripe payment intent after client confirmation and persists the final payment status, card metadata, and receipt URL.',
    bodyType: FinalizeStripePaymentDto,
    params: [{ name: 'id', description: 'Payment attempt identifier' }],
    envelope: true,
    responses: [
      { status: 200, description: 'Payment attempt finalized.' },
      { status: 400, description: 'Invalid finalization request.' },
      { status: 404, description: 'Payment attempt not found.' },
      { status: 503, description: 'Stripe is not configured.' },
    ],
  })
  async finalizeStripeAttempt(@Param('id') paymentAttemptId: string, @Body() dto: FinalizeStripePaymentDto) {
    return this.paymentsService.finalizeStripeAttempt(paymentAttemptId, dto);
  }
}
