import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisService } from '../../../common/redis/redis.service';

export type RefreshPayload = {
  sub: string;
  email: string;
  jti: string;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly redisService: RedisService) {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) throw new Error('JWT_REFRESH_SECRET is not defined');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: RefreshPayload) {
    console.log('JWT PAYLOAD:', payload);
    if (!payload?.jti) {
      throw new UnauthorizedException('Missing jti');
    }

    const refreshToken = req?.headers?.authorization?.replace('Bearer ', '');
    const isBlacklisted = await this.redisService.isBlacklisted(payload.jti);

    if (isBlacklisted) {
      throw new UnauthorizedException();
    }

    if (!payload?.sub) {
      throw new UnauthorizedException();
    }

    return {
      userId: payload.sub,
      email: payload.email,
      jti: payload.jti,
      refreshToken,
    };
  }
}
