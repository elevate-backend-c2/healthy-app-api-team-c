import {
    BadRequestException,
    Inject,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import Stripe from 'stripe';

import { STRIPE_CLIENT } from './stripe/stripe.constants';
import { StripeCustomerService } from './stripe/stripe-customer.service';
import { SetupIntentResponseDto } from './dto/setup-intent-response.dto';
import { CardsResponseDto, CardDto } from './dto/cards-response.dto';

@Injectable()
export class PaymentsService {
    constructor(
        private readonly stripeCustomerService: StripeCustomerService,

        @Inject(STRIPE_CLIENT)
        private readonly stripe: Stripe,
    ) { }

    async createSetupIntent(userId: string): Promise<SetupIntentResponseDto> {
        const stripeCustomerId =
            await this.stripeCustomerService.getOrCreateCustomer(userId);

        const setupIntent = await this.stripe.setupIntents.create({
            customer: stripeCustomerId,
            payment_method_types: ['card'],
            usage: 'off_session',
        });

        if (!setupIntent.client_secret) {
            throw new InternalServerErrorException(
                'Stripe setup intent client secret was not created',
            );
        }

        return {
            setupIntentId: setupIntent.id,
            clientSecret: setupIntent.client_secret,
        };
    }

    async addCard(
        userId: string,
        stripePaymentMethodId: string,
    ): Promise<CardsResponseDto> {
        const stripeCustomerId =
            await this.stripeCustomerService.getOrCreateCustomer(userId);

        try {
            const existingCardsBeforeAttach =
                await this.stripe.paymentMethods.list({
                    customer: stripeCustomerId,
                    type: 'card',
                    limit: 1,
                });

            const isFirstCard = existingCardsBeforeAttach.data.length === 0;

            const attachedPaymentMethod =
                await this.stripe.paymentMethods.attach(stripePaymentMethodId, {
                    customer: stripeCustomerId,
                });

            if (isFirstCard) {
                await this.stripe.customers.update(stripeCustomerId, {
                    invoice_settings: {
                        default_payment_method: attachedPaymentMethod.id,
                    },
                });
            }

            return this.listCardsByStripeCustomerId(stripeCustomerId);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to attach payment method';

            throw new BadRequestException(message);
        }
    }

    async listCards(userId: string): Promise<CardsResponseDto> {
        const stripeCustomerId =
            await this.stripeCustomerService.getOrCreateCustomer(userId);

        return this.listCardsByStripeCustomerId(stripeCustomerId);
    }

    async deleteCard(
        userId: string,
        paymentMethodId: string,
    ): Promise<CardsResponseDto> {
        const stripeCustomerId =
            await this.stripeCustomerService.getOrCreateCustomer(userId);

        try {
            const paymentMethod =
                await this.stripe.paymentMethods.retrieve(paymentMethodId);

            if (paymentMethod.customer !== stripeCustomerId) {
                throw new BadRequestException(
                    'Payment method does not belong to the authenticated user',
                );
            }

            const customer = await this.stripe.customers.retrieve(stripeCustomerId);

            const defaultPaymentMethodId =
                !customer.deleted &&
                    typeof customer.invoice_settings.default_payment_method === 'string'
                    ? customer.invoice_settings.default_payment_method
                    : null;

            const isDeletingDefaultCard =
                paymentMethod.id === defaultPaymentMethodId;

            await this.stripe.paymentMethods.detach(paymentMethodId);

            if (isDeletingDefaultCard) {
                const remainingPaymentMethods =
                    await this.stripe.paymentMethods.list({
                        customer: stripeCustomerId,
                        type: 'card',
                        limit: 1,
                    });

                const nextDefaultPaymentMethod =
                    remainingPaymentMethods.data[0];

                if (nextDefaultPaymentMethod) {
                    await this.stripe.customers.update(stripeCustomerId, {
                        invoice_settings: {
                            default_payment_method: nextDefaultPaymentMethod.id,
                        },
                    });
                } else {
                    await this.stripe.customers.update(stripeCustomerId, {
                        invoice_settings: {
                            default_payment_method: null as unknown as string,
                        },
                    });
                }
            }

            return this.listCardsByStripeCustomerId(stripeCustomerId);
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to delete payment method';

            throw new BadRequestException(message);
        }
    }

    private async listCardsByStripeCustomerId(
        stripeCustomerId: string,
    ): Promise<CardsResponseDto> {
        const [paymentMethods, customer] = await Promise.all([
            this.stripe.paymentMethods.list({
                customer: stripeCustomerId,
                type: 'card',
            }),
            this.stripe.customers.retrieve(stripeCustomerId),
        ]);

        const defaultPaymentMethodId =
            !customer.deleted &&
                typeof customer.invoice_settings.default_payment_method === 'string'
                ? customer.invoice_settings.default_payment_method
                : null;

        const cards: CardDto[] = paymentMethods.data.map((paymentMethod) => {
            if (!paymentMethod.card) {
                throw new InternalServerErrorException(
                    'Payment method card details are missing',
                );
            }

            return {
                id: paymentMethod.id,
                brand: paymentMethod.card.brand,
                last4: paymentMethod.card.last4,
                expMonth: paymentMethod.card.exp_month,
                expYear: paymentMethod.card.exp_year,
                isDefault: paymentMethod.id === defaultPaymentMethodId,
            };
        });

        return { cards };
    }
}