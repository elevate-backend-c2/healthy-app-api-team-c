import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';

type UserPayload = {
  id: string;
  email: string;
};

export async function generateTokens(
  jwtService: JwtService,
  user: UserPayload,
) {
  const accessToken = await jwtService.signAsync(
    {
      sub: user.id,
      email: user.email,
      jti: randomUUID(),
    },
    {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    },
  );

  const refreshToken = await jwtService.signAsync(
    {
      sub: user.id,
      jti: randomUUID(),
    },
    {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    },
  );

  return {
    accessToken,
    refreshToken,
  };
}
