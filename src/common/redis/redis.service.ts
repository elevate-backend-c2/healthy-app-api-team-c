import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

export interface OtpRecord {
  hashedOtp: string;
  attempts: number;
  verified: boolean;
}

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redis: Redis) { }

  async blacklistToken(jti: string, ttl: number) {
    await this.redis.set(`bl:${jti}`, '1', 'EX', ttl);
  }

  async isBlacklisted(jti: string) {
    const result = await this.redis.get(`bl:${jti}`);
    return result === '1';
  }

  async setLastLogin(userId: string) {
    await this.redis.set(
      `user:last-login:${userId}`,
      new Date().toISOString(),
    );
  }

  // ─── OTP Recovery methods ────────────────────────────────────────

  private otpKey(email: string) {
    return `otp:recovery:${email}`;
  }

  private cooldownKey(email: string) {
    return `otp:cooldown:${email}`;
  }

  /** Check if user is in cooldown (sent OTP recently) */
  async isOtpCooldown(email: string): Promise<boolean> {
    const result = await this.redis.get(this.cooldownKey(email));
    return result === '1';
  }

  /** Save hashed OTP with 10 min expiry + 60s cooldown */
  async saveOtp(email: string, hashedOtp: string): Promise<void> {
    const record: OtpRecord = {
      hashedOtp,
      attempts: 0,
      verified: false,
    };
    await this.redis.set(
      this.otpKey(email),
      JSON.stringify(record),
      'EX',
      600, // 10 minutes
    );
    await this.redis.set(
      this.cooldownKey(email),
      '1',
      'EX',
      60, // 1 minute cooldown
    );
  }

  /** Get OTP record */
  async getOtp(email: string): Promise<OtpRecord | null> {
    const raw = await this.redis.get(this.otpKey(email));
    if (!raw) return null;
    return JSON.parse(raw) as OtpRecord;
  }

  /** Increment attempt counter — returns updated record */
  async incrementOtpAttempts(email: string): Promise<OtpRecord | null> {
    const record = await this.getOtp(email);
    if (!record) return null;

    record.attempts += 1;

    // Preserve remaining TTL
    const ttl = await this.redis.ttl(this.otpKey(email));
    await this.redis.set(
      this.otpKey(email),
      JSON.stringify(record),
      'EX',
      ttl > 0 ? ttl : 600,
    );
    return record;
  }

  /** Mark OTP as verified */
  async markOtpVerified(email: string): Promise<void> {
    const record = await this.getOtp(email);
    if (!record) return;

    record.verified = true;
    const ttl = await this.redis.ttl(this.otpKey(email));
    await this.redis.set(
      this.otpKey(email),
      JSON.stringify(record),
      'EX',
      ttl > 0 ? ttl : 600,
    );
  }

  /** Delete OTP after successful password reset */
  async deleteOtp(email: string): Promise<void> {
    await this.redis.del(this.otpKey(email));
  }

  /** Revoke all sessions for a user (used after password reset) */
  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.redis.set(`revoked:user:${userId}`, '1');
  }

  async isUserRevoked(userId: string): Promise<boolean> {
    const result = await this.redis.get(`revoked:user:${userId}`);
    return result === '1';
  }
}