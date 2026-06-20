import { Injectable, UnauthorizedException } from '@nestjs/common';
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

  // ===================== AUTOCOMPLETE LOGIC =====================

  async autocomplete(query: string) {
    // [Criteria] Return early with empty array if search query length < 3 characters.
    if (!query || query.trim().length < 3) {
      return { suggestions: [] };
    }

    const sanitizedQuery = query.trim();

    // [Criteria] Write dynamic query executing substring matches on Doctor names and Specialty names.
    // تشغيل الـ Queries بالتوازي لضمان الـ 50ms SLA
    const [doctors, specialties] = await Promise.all([
      // البحث في أسماء الدكاترة
      this.prisma.doctor.findMany({
        where: {
          name: {
            contains: sanitizedQuery,
            mode: 'insensitive',
          },
        },
        take: 10,
        select: {
          id: true,
          name: true,
          specialtyId: true, // هنا الـ specialtyId بيمثل اسم التخصص في السكيما بتاعتك
        },
      }),

      // البحث في التخصصات (بجيب الـ specialtyId الفريدة من جدول الدكاترة)
      this.prisma.doctor.findMany({
        where: {
          specialtyId: {
            contains: sanitizedQuery,
            mode: 'insensitive',
          },
        },
        distinct: ['specialtyId'], // تمنع التكرار
        take: 5,
        select: {
          specialtyId: true,
        },
      }),
    ]);

    // [Criteria] Autocomplete Response JSON Format mapping
    const doctorSuggestions = doctors.map((doc) => ({
      type: 'doctor',
      name: doc.name,
      specialty: doc.specialtyId, // بناءً على السكيما بتاعتك
      id: doc.id,
    }));

    const specialtySuggestions = specialties.map((spec) => ({
      type: 'specialty',
      name: spec.specialtyId,
      id: spec.specialtyId, // بما إنه ملوش جدول منفصل، الـ name هو الـ id هنا
    }));

    return {
      suggestions: [...specialtySuggestions, ...doctorSuggestions],
    };
  }

  // ===================== SECURE RECENT SEARCHES LOGIC =====================

  // [Criteria] GET /api/v1/doctors/recent-searches returns the last 5 searches.
  async getRecentSearches(userId: string) {
    return this.prisma.recentSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        term: true,
        type: true,
        targetId: true,
        createdAt: true,
      },
    });
  }

  // [Criteria] DELETE /api/v1/doctors/recent-searches/:id deletes a specific node securely
  async deleteRecentSearch(userId: string, id: string) {
    const searchNode = await this.prisma.recentSearch.findUnique({
      where: { id },
    });

    // (verify search history item belongs to the authenticated user).
    if (!searchNode || searchNode.userId !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to delete this search history item.',
      );
    }

    await this.prisma.recentSearch.delete({
      where: { id },
    });

    return { success: true };
  }

  // [Criteria] Automatically append successfully clicked searches to the user's history log.
  async appendToHistory(
    userId: string,
    data: { type: string; name: string; targetId: string },
  ) {
    // 1. ضيف السجل الجديد
    await this.prisma.recentSearch.create({
      data: {
        userId,
        term: data.name,
        type: data.type,
        targetId: data.targetId,
      },
    });

    // 2. تظهير وتطهير: نحافظ على آخر 5 عناصر فقط في الداتابيز عشان الـ Performance والـ Caching
    const count = await this.prisma.recentSearch.count({ where: { userId } });
    if (count > 5) {
      const oldestItems = await this.prisma.recentSearch.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        take: count - 5,
      });

      const idsToDelete = oldestItems.map((item) => item.id);
      await this.prisma.recentSearch.deleteMany({
        where: { id: { in: idsToDelete } },
      });
    }

    return { success: true };
  }
}
