import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Gender, DoctorTitle } from '../../../generated/client'; // الـ Enums دي بتيجي جاهزة من بريزما
import { ApiProperty } from '@nestjs/swagger';

export class CreateDoctorDto {
  @ApiProperty({ example: 'Dr. Mahmoud Ali' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'specialty-uuid' })
  @IsString()
  @IsNotEmpty()
  specialtyId: string;

  @ApiProperty({ example: 'male', enum: ['male', 'female'] })
  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @ApiProperty({ example: 'Dr.', enum: ['Dr.', 'Prof.', 'Assoc. Prof.'] })
  @IsEnum(DoctorTitle)
  @IsNotEmpty()
  title: DoctorTitle;

  @ApiProperty({ example: 'Cairo, Egypt' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @ApiProperty({ example: 4.5 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  rating?: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  viewsCount?: number;
}
