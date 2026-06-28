import {
    Body,
    Controller,
    InternalServerErrorException,
    Post,
    Get,
    Delete,
    Req,
    UseGuards,
    Param,

} from '@nestjs/common';
import type { Request } from 'express';
import {
    ApiBearerAuth,
    ApiBody,
    ApiCreatedResponse,
    ApiOperation,
    ApiOkResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { PaymentsService } from './payments.service';
import { SetupIntentResponseDto } from './dto/setup-intent-response.dto';
import { AddCardDto } from './dto/add-card.dto';
import { CardsResponseDto } from './dto/cards-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

type AuthenticatedRequest = Request & {
    user: {
        userId: string;
        email: string;
    };
};

@Controller({
    path: 'payments',
    version: '1',
})
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Create Stripe setup intent for saving card' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @Post('setup-intent')
    @UseGuards(JwtAuthGuard)
    async createSetupIntent(
        @Req() req: AuthenticatedRequest,
    ): Promise<SetupIntentResponseDto> {
        const userId = req.user.userId;

        if (!userId) {
            throw new InternalServerErrorException(
                'User id not found in JWT payload',
            );
        }

        return this.paymentsService.createSetupIntent(userId);
    }

    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Add a saved card to the authenticated user' })
    @ApiBody({ type: AddCardDto })
    @ApiCreatedResponse({ type: CardsResponseDto })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @Post('cards')
    @UseGuards(JwtAuthGuard)
    async addCard(
        @Req() req: AuthenticatedRequest,
        @Body() addCardDto: AddCardDto,
    ): Promise<CardsResponseDto> {
        const userId = req.user.userId;

        if (!userId) {
            throw new InternalServerErrorException(
                'User id not found in JWT payload',
            );
        }

        return this.paymentsService.addCard(
            userId,
            addCardDto.stripePaymentMethodId,
        );
    }

    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'List saved cards for the authenticated user' })
    @ApiOkResponse({ type: CardsResponseDto })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @Get('cards')
    @UseGuards(JwtAuthGuard)
    async listCards(
        @Req() req: AuthenticatedRequest,
    ): Promise<CardsResponseDto> {
        const userId = req.user.userId;

        if (!userId) {
            throw new InternalServerErrorException(
                'User id not found in JWT payload',
            );
        }

        return this.paymentsService.listCards(userId);
    }

    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Delete a saved card from the authenticated user' })
    @ApiOkResponse({ type: CardsResponseDto })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @Delete('cards/:id')
    @UseGuards(JwtAuthGuard)
    async deleteCard(
        @Req() req: AuthenticatedRequest,
        @Param('id') paymentMethodId: string,
    ): Promise<CardsResponseDto> {
        const userId = req.user.userId;

        if (!userId) {
            throw new InternalServerErrorException(
                'User id not found in JWT payload',
            );
        }

        return this.paymentsService.deleteCard(userId, paymentMethodId);
    }


}