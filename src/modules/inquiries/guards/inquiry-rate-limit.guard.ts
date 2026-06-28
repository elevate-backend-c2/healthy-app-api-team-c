import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { TooManyRequestsException } from '../../../common/exceptions/too-many-requests.exception';
import { RedisService } from '../../../common/redis/redis.service';
import { AuthRequest } from '../../../common/types/request.type';

const MAX_SUBMISSIONS = 3;
const WINDOW_SECONDS = 60 * 60; // 1 hour

@Injectable()
export class InquiryRateLimitGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const userId = req.user?.userId;

    if (!userId) {
      throw new TooManyRequestsException(
        'Unable to verify account for rate limiting.',
      );
    }

    const key = `ratelimit:inquiries:${userId}`;
    const { count, ttl } = await this.redisService.incrementRateLimit(
      key,
      WINDOW_SECONDS,
    );

    if (count > MAX_SUBMISSIONS) {
      const minutes = Math.ceil(ttl / 60);
      throw new TooManyRequestsException(
        `You've reached the limit of ${MAX_SUBMISSIONS} inquiry submissions per hour. Please try again in about ${minutes} minute(s).`,
      );
    }

    return true;
  }
}
