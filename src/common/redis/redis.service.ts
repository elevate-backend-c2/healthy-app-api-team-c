import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

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
    await this.redis.set(`user:last-login:${userId}`, new Date().toISOString());
  }
}
