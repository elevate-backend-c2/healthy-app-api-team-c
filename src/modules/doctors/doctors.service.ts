import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { FindDoctorsDto, SortBy } from './dto/find-doctors.dto';
import { Prisma } from '../../generated/client';
import { FindDoctorsResponseDto } from './dto/doctor-response.dto';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FindDoctorsDto): Promise<FindDoctorsResponseDto> {
    const where: Prisma.DoctorWhereInput = {};

    if (query.specialties?.length) {
      where.specialtyId = { in: query.specialties };
    }

    if (query.gender) {
      where.gender = query.gender;
    }

    if (query.title) {
      where.title = query.title;
    }

    if (query.location) {
      where.location = { equals: query.location, mode: 'insensitive' };
    }

    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      where.price = {};
      if (query.priceMin !== undefined) where.price.gte = query.priceMin;
      if (query.priceMax !== undefined) where.price.lte = query.priceMax;
    }

    if (query.minRating !== undefined) {
      where.rating = { gte: query.minRating };
    }

    const orderBy: Prisma.DoctorOrderByWithRelationInput = (() => {
      switch (query.sortBy) {
        case SortBy.PRICE_ASC:
          return { price: 'asc' };
        case SortBy.PRICE_DESC:
          return { price: 'desc' };
        case SortBy.RATING_DESC:
          return { rating: 'desc' };
        case SortBy.POPULARITY_DESC:
          return { viewsCount: 'desc' };
        default:
          return { createdAt: 'desc' };
      }
    })();

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.doctor.findMany({ where, orderBy, skip, take: limit }),
      this.prisma.doctor.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
