import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { DoctorTitle, Gender } from '../../../generated/enums';

export enum SortBy {
  PRICE_ASC = 'PRICE_ASC',
  PRICE_DESC = 'PRICE_DESC',
  RATING_DESC = 'RATING_DESC',
  POPULARITY_DESC = 'POPULARITY_DESC',
}

export class FindDoctorsDto {
  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Filter by specialty IDs',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  @Transform(
    ({ value }) => (Array.isArray(value) ? value : [value]) as string[],
  )
  specialties?: string[];

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ enum: DoctorTitle })
  @IsOptional()
  @IsEnum(DoctorTitle)
  title?: DoctorTitle;

  @ApiPropertyOptional({ description: 'Governorate or city', example: 'Cairo' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ type: Number, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({ type: Number, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @ApiPropertyOptional({ type: Number, minimum: 0, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minRating?: number;

  @ApiPropertyOptional({ enum: SortBy })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;

  @ApiPropertyOptional({ type: Number, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ type: Number, default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
