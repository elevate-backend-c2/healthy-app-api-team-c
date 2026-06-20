import { Request } from 'express';
export interface RefreshUser {
  userId: string;
  email: string;
  jti: string;
  refreshToken: string;
}

export interface AuthRequest extends Request {
  user: {
    userId: string;
  };
}
