import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { Request } from 'express';
import { Public } from '../../common/decorators/is-public';
import { JwtRefreshGuard } from '../../common/guards/jwt.auth.refresh.guard';
import { RefreshUser } from '../../common/types/request.type';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyRecoveryOtpDto } from './dto/verify-recovery-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) { }
  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description:
      'User has been successfully registered. Please check your email for verification.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'logout user' })
  @ApiResponse({
    status: 200,
    description: 'User logout in successfully',
  })
  async logout(@Req() req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(token!);
  }

  @Post('refresh')
  @Public()
  @UseGuards(JwtRefreshGuard)
  refresh(@Req() req: Request & { user: RefreshUser }) {
    return this.authService.refresh(req.user);
  }

  // ─── Password Recovery endpoints ──────────────────────────────────

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password recovery OTP' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Recovery email sent if account exists.',
  })
  @ApiResponse({
    status: 429,
    description: 'Cooldown active. Please wait before retrying.',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('verify-recovery-otp')
  @ApiOperation({ summary: 'Verify password recovery OTP' })
  @ApiBody({ type: VerifyRecoveryOtpDto })
  @ApiResponse({ status: 200, description: 'OTP verified successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP.' })
  @ApiResponse({
    status: 429,
    description: 'Too many failed attempts. OTP locked.',
  })
  verifyRecoveryOtp(@Body() dto: VerifyRecoveryOtpDto) {
    return this.authService.verifyRecoveryOtp(dto);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using verified OTP' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid OTP or password validation failed.',
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

}
