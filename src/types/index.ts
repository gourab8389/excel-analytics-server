import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export interface ProjectAuthRequest extends AuthRequest {
  project?: {
    id: string;
    role: string;
  };
}