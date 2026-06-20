import { ApiProperty } from '@nestjs/swagger';

export class RecentSearchResponseDto {
  @ApiProperty({ example: 'history-node-uuid' })
  id: string;

  @ApiProperty({ example: 'Cardiology' })
  term: string;

  @ApiProperty({ example: 'specialty', enum: ['doctor', 'specialty'] })
  type: string;

  @ApiProperty({ example: 'specialty-name-or-uuid' })
  targetId: string;

  @ApiProperty({ example: '2026-06-18T14:30:00.000Z' })
  createdAt: Date;
}
