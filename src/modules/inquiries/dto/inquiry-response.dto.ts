import { ApiProperty } from '@nestjs/swagger';
import { InquiryStatus } from '../../../generated/enums';

export class InquiryResponseDto {
  @ApiProperty({ format: 'uuid' })
  inquiryId: string;

  @ApiProperty({ enum: InquiryStatus, example: InquiryStatus.PENDING })
  status: InquiryStatus;

  @ApiProperty({
    example: 'Your inquiry has been anonymously submitted to a specialist.',
  })
  message: string;

  static of(inquiryId: string): InquiryResponseDto {
    const dto = new InquiryResponseDto();
    dto.inquiryId = inquiryId;
    dto.status = InquiryStatus.PENDING;
    dto.message =
      'Your inquiry has been anonymously submitted to a specialist.';
    return dto;
  }
}
