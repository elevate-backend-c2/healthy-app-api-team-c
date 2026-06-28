// src/payments/stripe/stripe.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { stripeProvider } from './stripe.provider';
import { StripeCustomerService } from './stripe-customer.service';

@Module({
    imports: [ConfigModule],

    providers: [
        stripeProvider,
        StripeCustomerService,
    ],

    exports: [
        stripeProvider,
        StripeCustomerService,
    ],
})
export class StripeModule { }