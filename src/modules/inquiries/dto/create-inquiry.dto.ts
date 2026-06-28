import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import DOMPurify from 'isomorphic-dompurify';
import { Gender } from '../../../generated/enums';

function sanitize(value: unknown): string {
  if (typeof value !== 'string') return value as string;
  const stripped = DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  return stripped.replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

export class CreateInquiryDto {
  @ApiProperty({
    description: 'UUID of the medical specialty this inquiry is routed to',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'specialtyId must be a valid UUID' })
  @IsNotEmpty()
  specialtyId: string;

  @ApiProperty({ maxLength: 50, example: 'Persistent headache' })
  @Transform(({ value }) => sanitize(value))
  @IsString()
  @IsNotEmpty({ message: 'title is required' })
  @MaxLength(50, { message: 'title must not exceed 50 characters' })
  title: string;

  @ApiProperty({
    maxLength: 250,
    example: 'Sharp pain behind the eyes for the last 3 days, worse at night.',
  })
  @Transform(({ value }) => sanitize(value))
  @IsString()
  @IsNotEmpty({ message: 'symptomsDescription is required' })
  @MaxLength(250, {
    message: 'symptomsDescription must not exceed 250 characters',
  })
  symptomsDescription: string;

  @ApiProperty({ minimum: 1, maximum: 120, example: 34 })
  @IsInt({ message: 'age must be an integer' })
  @Min(1, { message: 'age must be at least 1' })
  @Max(120, { message: 'age must not exceed 120' })
  age: number;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender, { message: 'gender must be MALE or FEMALE' })
  gender: Gender;
}
