import { Request, Response } from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { config } from '../config';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { createAuditLog } from '../middleware/auditLog';
import { AuthenticatedRequest } from '../middleware/auth';

function signAccessToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
}

function signRefreshToken(userId: string) {
  return jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export async function register(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const fieldErrors: Record<string, string> = {};
    errors.array().forEach((e) => {
      if ('path' in e) fieldErrors[e.path as string] = e.msg;
    });
    return errorResponse(res, 'Validation failed', 400, fieldErrors);
  }

  const { name, email, mobile, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return errorResponse(res, 'Email already registered', 409);
  }

  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.create({
    data: { name, email, mobile, passwordHash },
    select: { id: true, name: true, email: true, mobile: true, role: true, createdAt: true },
  });

  await createAuditLog({
    userId: user.id,
    action: 'USER_REGISTERED',
    description: `New user registered: ${email}`,
    req,
  });

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);

  return successResponse(res, { user, accessToken, refreshToken }, 'Registration successful', 201);
}

export async function login(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 'Validation failed', 400);
  }

  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return errorResponse(res, 'Invalid email or password', 401);
  }

  if (user.status === 'DISABLED') {
    return errorResponse(res, 'Account has been disabled', 403);
  }

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) {
    return errorResponse(res, 'Invalid email or password', 401);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createAuditLog({
    userId: user.id,
    action: user.role === 'ADMIN' ? 'ADMIN_LOGIN' : 'USER_LOGIN',
    description: `User logged in: ${email}`,
    req,
  });

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);

  return successResponse(res, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
    },
    accessToken,
    refreshToken,
  });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return errorResponse(res, 'Refresh token required', 400);
  }

  try {
    const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, status: true },
    });

    if (!user || user.status === 'DISABLED') {
      return errorResponse(res, 'Invalid refresh token', 401);
    }

    const accessToken = signAccessToken(user.id, user.role);
    const newRefreshToken = signRefreshToken(user.id);
    return successResponse(res, { accessToken, refreshToken: newRefreshToken });
  } catch {
    return errorResponse(res, 'Invalid or expired refresh token', 401);
  }
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  await createAuditLog({
    userId: req.userId,
    action: 'USER_LOGOUT',
    description: 'User logged out',
    req,
  });
  return successResponse(res, null, 'Logged out successfully');
}

export async function me(req: AuthenticatedRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      role: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) return errorResponse(res, 'User not found', 404);
  return successResponse(res, user);
}
