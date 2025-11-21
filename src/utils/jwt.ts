import jwt from 'jsonwebtoken';
import { environment } from '../config/environment';
import { JwtPayload } from '../types';

export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, environment.jwtSecret, {
    expiresIn: environment.jwtExpiresIn
  } as any);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, environment.jwtSecret) as JwtPayload;
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};
