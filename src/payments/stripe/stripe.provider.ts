// src/payments/stripe/stripe.provider.ts

import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from './stripe.constants';

export const stripeProvider: Provider = {
    provide: STRIPE_CLIENT,

    inject: [ConfigService],

    useFactory: (configService: ConfigService) => {
        const secretKey = configService.get<string>('STRIPE_SECRET_KEY');

        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY is missing from environment variables');
        }

        return new Stripe(secretKey);
    },
};