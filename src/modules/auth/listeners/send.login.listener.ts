import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailerService } from '@nestjs-modules/mailer';
import { RedisService } from '../../../common/redis/redis.service';

@Injectable()
export class LoginNotificationListener {
  constructor(
    private readonly mailerService: MailerService,
    private readonly redisService: RedisService,
  ) {}

  @OnEvent('user.logged_in', { async: true })
  async handle(payload: { userId: string; email: string; loginAt: string }) {
    await this.redisService.setLastLogin(payload.userId);
    await this.mailerService.sendMail({
      to: payload.email,
      subject: 'Login Notification',
      text: `Your account was accessed successfully at ${payload.loginAt}`,
    });
  }
}
