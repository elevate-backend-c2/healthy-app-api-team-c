import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class LogoutNotificationListener {
  constructor(
    private readonly mailerService: MailerService,
    private readonly userService: UserService,
  ) {}

  @OnEvent('user.logged_out', { async: true })
  async handle(payload: { email: string }) {
    await this.mailerService.sendMail({
      to: payload.email,
      subject: 'Logout Notification',
      text: 'Your account has been logged out successfully.',
    });
  }
}
