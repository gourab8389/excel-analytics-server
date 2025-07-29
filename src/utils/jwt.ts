import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/auth';
const JWT_SECRET = process.env.JWT_SECRET|| '1234567890abcdef';

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};

export const generateInvitationToken = (
  email: string,
  projectId: string
): string => {
  return jwt.sign({ email, projectId }, JWT_SECRET, {
    expiresIn: '7d',
  });
};
