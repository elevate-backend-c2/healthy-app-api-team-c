import { Injectable } from '@nestjs/common';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { InquiryResponseDto } from './dto/inquiry-response.dto';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class InquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(dto: CreateInquiryDto): Promise<InquiryResponseDto> {
    const inquiry = await this.prisma.inquiry.create({
      data: {
        specialtyId: dto.specialtyId,
        title: dto.title,
        symptomsDescription: dto.symptomsDescription,
        age: dto.age,
        gender: dto.gender,
      },
    });

    return InquiryResponseDto.of(inquiry.id);
  }
}
