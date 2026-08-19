import { Request } from 'express';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface AuditOptions {
  userId?: string;
  submissionId?: string;
  action: string;
  description: string;
  req?: Request;
}

export async function createAuditLog(opts: AuditOptions) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: opts.userId,
        submissionId: opts.submissionId,
        action: opts.action,
        description: opts.description,
        ipAddress: opts.req
          ? (opts.req.headers['x-forwarded-for'] as string) || opts.req.socket.remoteAddress
          : undefined,
        userAgent: opts.req ? opts.req.headers['user-agent'] : undefined,
      },
    });
  } catch (err) {
    logger.error('Failed to create audit log', err);
  }
}
