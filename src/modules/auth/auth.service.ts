import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { generateTokens } from '../../util/generate-tokens';
import { RedisService } from '../../common/redis/redis.service';
import { JwtDecodedPayload } from './interfaces/jwt.decoded';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
    private readonly jwtService: JwtService,
    private readonly RedisService: RedisService,
  ) {}
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
}
