import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../utils/prisma';
import { errorResponse } from '../utils/apiResponse';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse(res, 'Unauthorized', 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, status: true },
    });

    if (!user || user.status === 'DISABLED') {
      return errorResponse(res, 'Account disabled or not found', 401);
    }

    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch {
    return errorResponse(res, 'Invalid or expired token', 401);
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (req.userRole !== 'ADMIN') {
    return errorResponse(res, 'Forbidden: Admin access required', 403);
  }
  next();
}
