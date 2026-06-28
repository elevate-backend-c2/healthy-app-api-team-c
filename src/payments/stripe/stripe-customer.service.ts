// src/payments/stripe/stripe-customer.service.ts

import {
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Stripe from 'stripe';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { PrismaService } from '../../../prisma/prisma.service';
import { STRIPE_CLIENT } from './stripe.constants';

@Injectable()
export class StripeCustomerService {
    constructor(
        private readonly prisma: PrismaService,

        @Inject(STRIPE_CLIENT)
        private readonly stripe: Stripe,

        @InjectRedis()
        private readonly redis: Redis,
    ) { }

    async getOrCreateCustomer(userId: string): Promise<string> {
        const cacheKey = `payments:user:${userId}:stripeCustomerId`;

        const cachedCustomerId = await this.redis.get(cacheKey);

        if (cachedCustomerId) {
            return cachedCustomerId;
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                stripeCustomerId: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.stripeCustomerId) {
            await this.redis.set(cacheKey, user.stripeCustomerId, 'EX', 60 * 60);
            return user.stripeCustomerId;
        }

        const lockKey = `lock:payments:user:${userId}:stripeCustomer`;
        const lockValue = randomUUID();

        const lockResult = await this.redis.set(
            lockKey,
            lockValue,
            'EX',
            10,
            'NX',
        );

        if (lockResult !== 'OK') {
            await new Promise((resolve) => setTimeout(resolve, 300));
            return this.getOrCreateCustomer(userId);
        }

        try {
            const freshUser = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    stripeCustomerId: true,
                },
            });

            if (!freshUser) {
                throw new NotFoundException('User not found');
            }

            if (freshUser.stripeCustomerId) {
                await this.redis.set(cacheKey, freshUser.stripeCustomerId, 'EX', 60 * 60);
                return freshUser.stripeCustomerId;
            }

            const stripeCustomer = await this.stripe.customers.create({
                email: freshUser.email,
                metadata: {
                    userId: freshUser.id,
                },
            });

            await this.prisma.user.update({
                where: { id: freshUser.id },
                data: {
                    stripeCustomerId: stripeCustomer.id,
                },
            });

            await this.redis.set(cacheKey, stripeCustomer.id, 'EX', 60 * 60);

            return stripeCustomer.id;
        } finally {
            const currentLockValue = await this.redis.get(lockKey);

            if (currentLockValue === lockValue) {
                await this.redis.del(lockKey);
            }
        }
    }
}