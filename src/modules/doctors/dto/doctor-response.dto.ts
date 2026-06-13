import { ApiProperty } from '@nestjs/swagger';
import { Gender, DoctorTitle } from '../../../generated/enums';

export class DoctorDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() specialtyId: string;
  @ApiProperty({ enum: Gender }) gender: Gender;
  @ApiProperty({ enum: DoctorTitle }) title: DoctorTitle;
  @ApiProperty() location: string;
  @ApiProperty() price: number;
  @ApiProperty() rating: number;
  @ApiProperty() viewsCount: number;
  @ApiProperty() createdAt: Date;
}

export class FindDoctorsResponseDto {
  @ApiProperty({ type: [DoctorDto] })
  data: DoctorDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
