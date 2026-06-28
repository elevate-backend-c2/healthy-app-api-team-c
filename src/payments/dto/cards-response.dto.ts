import { ApiProperty } from '@nestjs/swagger';

export class CardDto {
    @ApiProperty({ example: 'pm_card_visa' })
    id: string;

    @ApiProperty({ example: 'visa' })
    brand: string;

    @ApiProperty({ example: '4242' })
    last4: string;

    @ApiProperty({ example: 12 })
    expMonth: number;

    @ApiProperty({ example: 2028 })
    expYear: number;

    @ApiProperty({ example: true })
    isDefault: boolean;
}

export class CardsResponseDto {
    @ApiProperty({ type: [CardDto] })
    cards: CardDto[];
}