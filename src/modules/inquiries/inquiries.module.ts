import { Module } from '@nestjs/common';
import { InquiriesController } from './inquiries.controller';
import { InquiriesService } from './inquiries.service';
import { InquiryRateLimitGuard } from './guards/inquiry-rate-limit.guard';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [InquiriesController],
  providers: [InquiriesService, InquiryRateLimitGuard],
})
export class InquiriesModule {}
