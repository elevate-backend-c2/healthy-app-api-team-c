import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userService.createUserByRegister(dto, passwordHash);
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
  }
}
