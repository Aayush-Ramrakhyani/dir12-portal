import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { createAuditLog } from '../middleware/auditLog';

export async function listUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      role: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return successResponse(res, users);
}

export async function toggleUserStatus(req: AuthenticatedRequest, res: Response) {
  const { userId } = req.params;

  if (userId === req.userId) {
    return errorResponse(res, 'Cannot disable your own account', 400);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return errorResponse(res, 'User not found', 404);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' },
    select: { id: true, name: true, email: true, status: true },
  });

  await createAuditLog({
    userId: req.userId,
    action: 'ADMIN_TOGGLED_USER_STATUS',
    description: `User ${user.email} status changed to ${updated.status}`,
    req,
  });

  return successResponse(res, updated);
}

export async function listAllSubmissions(req: Request, res: Response) {
  const { status, search, page = '1', limit = '20' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};

  if (status) where.status = status;

  if (search) {
    where.OR = [
      { referenceNumber: { contains: search as string, mode: 'insensitive' } },
      { company: { cin: { contains: search as string, mode: 'insensitive' } } },
      { company: { companyName: { contains: search as string, mode: 'insensitive' } } },
      { user: { email: { contains: search as string, mode: 'insensitive' } } },
    ];
  }

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        company: { select: { cin: true, companyName: true } },
        _count: { select: { directors: true, attachments: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.submission.count({ where }),
  ]);

  return successResponse(res, { submissions, total, page: pageNum, limit: limitNum });
}

export async function adminGetSubmission(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      company: true,
      directors: true,
      kmps: true,
      attachments: true,
      declarations: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!submission) return errorResponse(res, 'Submission not found', 404);

  await createAuditLog({
    userId: req.userId,
    submissionId: id,
    action: 'ADMIN_VIEWED_SUBMISSION',
    description: `Admin viewed submission ${submission.referenceNumber || id}`,
    req,
  });

  return successResponse(res, submission);
}

export async function updateSubmissionStatus(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { status, comment } = req.body;

  const validStatuses = [
    'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'QUERY_RAISED',
    'RESUBMITTED', 'APPROVED', 'REJECTED',
  ];

  if (!validStatuses.includes(status)) {
    return errorResponse(res, 'Invalid status', 400);
  }

  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission) return errorResponse(res, 'Submission not found', 404);

  await prisma.$transaction(async (tx) => {
    await tx.submission.update({ where: { id }, data: { status } });
    await tx.statusHistory.create({
      data: {
        submissionId: id,
        oldStatus: submission.status,
        newStatus: status,
        changedBy: req.userId!,
        comment,
      },
    });
  });

  await createAuditLog({
    userId: req.userId,
    submissionId: id,
    action: 'STATUS_CHANGED',
    description: `Status changed from ${submission.status} to ${status}${comment ? ': ' + comment : ''}`,
    req,
  });

  return successResponse(res, { status }, 'Status updated');
}

export async function listAuditLogs(req: Request, res: Response) {
  const { page = '1', limit = '50' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, email: true } },
        submission: { select: { referenceNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.auditLog.count(),
  ]);

  return successResponse(res, { logs, total, page: pageNum, limit: limitNum });
}

export async function adminDashboardStats(_req: Request, res: Response) {
  const [
    totalUsers,
    totalSubmissions,
    drafts,
    submitted,
    underReview,
    approved,
    rejected,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.submission.count(),
    prisma.submission.count({ where: { status: 'DRAFT' } }),
    prisma.submission.count({ where: { status: 'SUBMITTED' } }),
    prisma.submission.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.submission.count({ where: { status: 'APPROVED' } }),
    prisma.submission.count({ where: { status: 'REJECTED' } }),
  ]);

  return successResponse(res, {
    totalUsers,
    totalSubmissions,
    drafts,
    submitted,
    underReview,
    approved,
    rejected,
  });
}
