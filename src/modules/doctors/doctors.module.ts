import { Module } from '@nestjs/common';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  controllers: [DoctorsController],
  providers: [DoctorsService],
  imports: [PrismaModule],
})
export class DoctorsModule {}
