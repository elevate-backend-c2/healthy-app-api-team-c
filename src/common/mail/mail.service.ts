import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private readonly transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailService.name);

    constructor(private readonly configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('MAIL_HOST'),
            port: 587,
            secure: false,
            tls: {
                rejectUnauthorized: false,
            },
            auth: {
                user: this.configService.get<string>('MAIL_USER'),
                pass: this.configService.get<string>('MAIL_PASS'),
            },
        });
    }

    async sendPasswordRecoveryOtp(email: string, otp: string): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: `"${this.configService.get<string>('MAIL_FROM_NAME')}" <${this.configService.get<string>('MAIL_FROM_ADDRESS')}>`,
                to: email,
                subject: 'Password Recovery OTP',
                html: this.buildOtpEmailTemplate(otp),
            });
        } catch (error) {
            this.logger.error(`Failed to send OTP email to ${email}`, error);
            throw error;
        }
    }

    private buildOtpEmailTemplate(otp: string): string {
        return `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #111827; margin-bottom: 8px;">Password Recovery</h2>
        <p style="color: #6b7280; margin-bottom: 24px;">Use the code below to reset your password. It expires in <strong>10 minutes</strong>.</p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; text-align: center; letter-spacing: 12px; font-size: 32px; font-weight: bold; color: #111827;">
          ${otp}
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;
    }
}