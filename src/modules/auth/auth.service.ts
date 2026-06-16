import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID, randomInt } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { generateTokens } from '../../util/generate-tokens';
import { RedisService } from '../../common/redis/redis.service';
import { JwtDecodedPayload } from './interfaces/jwt.decoded';
import { MailService } from '../../common/mail/mail.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyRecoveryOtpDto } from './dto/verify-recovery-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { TooManyRequestsException } from '../../common/exceptions/too-many-requests.exception';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
    private readonly jwtService: JwtService,
    private readonly RedisService: RedisService,
    private readonly mailService: MailService,
  ) { }
  async register(dto: RegisterDto) {
    try {
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const user = await this.userService.createUserByRegister(
        dto,
        passwordHash,
      );
      this.eventEmitter.emit('user.registered', {
        userId: user.id,
        email: user.email,
      });
      const transactionId = randomUUID();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      return {
        transactionId,
        message: 'Verification code has been successfully dispatched.',
        expiresAt,
      };
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await generateTokens(this.jwtService, user);
    this.eventEmitter.emit('user.logged_in', {
      userId: user.id,
      email: user.email,
      loginAt: new Date().toISOString(),
    });

    return {
      message: 'Login successful',
      ...tokens,
    };
  }

  async logout(token: string) {
    const decoded = this.jwtService.decode<JwtDecodedPayload>(token);
    const now = Math.floor(Date.now() / 1000);
    const ttl = decoded.exp - now;

    await this.RedisService.blacklistToken(decoded.jti, ttl);

    this.eventEmitter.emit('user.logged_out', {
      email: decoded.email,
    });

    return { message: 'Logged out successfully' };
  }

  async refresh(user: { userId: string; email: string; jti: string }) {
    // 2. generate new tokens
    const tokens = await generateTokens(this.jwtService, {
      id: user.userId,
      email: user.email,
    });

    await this.RedisService.blacklistToken(user.jti, 7 * 24 * 60 * 60);

    return {
      message: 'Tokens refreshed successfully',
      ...tokens,
    };
  }


  // ─── Password Recovery ────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    // Generic response always — prevents user enumeration
    const genericResponse = {
      message:
        'If this email is registered, a recovery code has been sent.',
    };

    const user = await this.userService.findByEmail(dto.email);
    if (!user) return genericResponse;

    // Check cooldown (prevent spamming)
    const inCooldown = await this.RedisService.isOtpCooldown(dto.email);
    if (inCooldown) {
      throw new TooManyRequestsException(
        'Please wait before requesting another code.',
      );
    }

    // Generate 4-digit OTP using crypto (secure random)
    const otp = randomInt(1000, 9999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Save hashed OTP in Redis with 10 min expiry
    await this.RedisService.saveOtp(dto.email, hashedOtp);

    // Send email (fire and forget — don't block response)
    this.mailService.sendPasswordRecoveryOtp(dto.email, otp).catch((err) => {
      console.error('Failed to send recovery email:', err);
    });

    return genericResponse;
  }

  async verifyRecoveryOtp(dto: VerifyRecoveryOtpDto) {
    const record = await this.RedisService.getOtp(dto.email);

    // OTP not found or expired
    if (!record) {
      throw new BadRequestException('OTP expired or not found.');
    }

    // Already locked (exceeded max attempts)
    if (record.attempts >= 3) {
      throw new TooManyRequestsException(
        'Too many failed attempts. Please request a new code.',
      );
    }

    // Verify OTP against hashed version
    const isValid = await bcrypt.compare(dto.otpCode, record.hashedOtp);

    if (!isValid) {
      // Increment attempts
      const updated = await this.RedisService.incrementOtpAttempts(dto.email);

      // Lock after this failed attempt
      if (updated && updated.attempts >= 3) {
        throw new TooManyRequestsException(
          'Too many failed attempts. Please request a new code.',
        );
      }

      throw new BadRequestException('Invalid OTP code.');
    }

    // Mark as verified
    await this.RedisService.markOtpVerified(dto.email);

    return { message: 'OTP verified successfully.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.RedisService.getOtp(dto.email);

    // OTP not found or expired
    if (!record) {
      throw new BadRequestException('OTP expired or not found.');
    }

    // OTP must be verified first
    if (!record.verified) {
      throw new BadRequestException(
        'OTP has not been verified. Please verify your OTP first.',
      );
    }

    // Double-check OTP code is still valid
    const isValid = await bcrypt.compare(dto.otpCode, record.hashedOtp);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP code.');
    }

    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    // Update password in DB
    await this.userService.updatePassword(user.id, newPasswordHash);

    // Security clean-up: revoke all sessions
    await this.RedisService.revokeAllUserSessions(user.id);

    // Delete OTP record
    await this.RedisService.deleteOtp(dto.email);

    this.eventEmitter.emit('user.password_reset', {
      userId: user.id,
      email: user.email,
    });

    return { message: 'Password has been reset successfully.' };
  }


}
