import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyRecoveryOtpDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: '4821' })
    @IsString()
    @IsNotEmpty()
    @Length(4, 4, { message: 'OTP must be exactly 4 digits' })
    otpCode: string;
}