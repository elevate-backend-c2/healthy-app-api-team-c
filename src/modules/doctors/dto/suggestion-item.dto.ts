import { ApiProperty } from '@nestjs/swagger';

export class SuggestionItemDto {
  @ApiProperty({ example: 'doctor', enum: ['doctor', 'specialty'] })
  type: string;

  @ApiProperty({ example: 'Dr. Mahmoud Ali' })
  name: string;

  @ApiProperty({
    example: 'Cardiology',
    required: false,
    description: 'Only present if type is doctor',
  })
  specialty?: string;

  @ApiProperty({ example: 'uuid-v4-resolved-id' })
  id: string;
}
