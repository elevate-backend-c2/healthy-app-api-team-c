import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { IsEqualTo } from '../../../common/decorators/is-equal-to.decorator';
import { Gender } from '../../../generated/enums';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
    message:
      'Password must have uppercase, lowercase, number, and special character',
  })
  password: string;

  @IsNotEmpty()
  @IsEqualTo('password')
  @IsString()
  confirmPassword: string;
}
