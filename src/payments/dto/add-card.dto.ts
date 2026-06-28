import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class AddCardDto {
    @ApiProperty({
        example: 'pm_card_visa',
        description: 'Stripe PaymentMethod ID',
    })
    @IsString()
    @IsNotEmpty()
    @Matches(/^pm_/, {
        message: 'stripePaymentMethodId must start with pm_',
    })
    stripePaymentMethodId: string;
}