import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { SendOtpListener } from './listeners/send-otp.listener';

@Module({
  imports: [UserModule],
  controllers: [AuthController],
  providers: [AuthService, SendOtpListener],
})
export class AuthModule {}
