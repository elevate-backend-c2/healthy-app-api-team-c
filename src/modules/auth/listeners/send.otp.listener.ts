// listeners/send-otp.listener.ts
import { OnEvent } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class SendOtpListener {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly MailerService: MailerService,
  ) {}

  @OnEvent('user.registered', { async: true })
  async handle(payload: { userId: string; email: string }) {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const otpHash = await bcrypt.hash(otp, 10);

    await this.redis.set(`otp:${payload.email}`, otpHash, 'EX', 600);

    await this.MailerService.sendMail({
      to: payload.email,
      subject: 'OTP Verification',
      text: `Your OTP is ${otp}`,
    });
  }
}
