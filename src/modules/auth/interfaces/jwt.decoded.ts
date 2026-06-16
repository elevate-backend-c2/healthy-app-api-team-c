export interface JwtDecodedPayload {
  sub: string;
  email: string;
  jti: string;
  exp: number;
  iat?: number;
}
