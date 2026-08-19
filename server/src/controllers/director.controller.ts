import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { createAuditLog } from '../middleware/auditLog';

export async function addDirector(req: AuthenticatedRequest, res: Response) {
  const { id: submissionId } = req.params;

  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, userId: req.userId },
  });
  if (!submission) return errorResponse(res, 'Submission not found', 404);
  if (submission.status !== 'DRAFT') {
    return errorResponse(res, 'Cannot edit a submitted form', 400);
  }

  const director = await prisma.director.create({
    data: { submissionId, ...req.body },
  });

  await createAuditLog({
    userId: req.userId,
    submissionId,
    action: 'DIRECTOR_ADDED',
    description: `Director added to submission`,
    req,
  });

  return successResponse(res, director, 'Director added', 201);
}

export async function updateDirector(req: AuthenticatedRequest, res: Response) {
  const { directorId } = req.params;

  const director = await prisma.director.findFirst({
    where: { id: directorId },
    include: { submission: { select: { userId: true, status: true } } },
  });

  if (!director || director.submission.userId !== req.userId) {
    return errorResponse(res, 'Director not found', 404);
  }
  if (director.submission.status !== 'DRAFT') {
    return errorResponse(res, 'Cannot edit a submitted form', 400);
  }

  const updated = await prisma.director.update({
    where: { id: directorId },
    data: req.body,
  });

  return successResponse(res, updated, 'Director updated');
}

export async function deleteDirector(req: AuthenticatedRequest, res: Response) {
  const { directorId } = req.params;

  const director = await prisma.director.findFirst({
    where: { id: directorId },
    include: { submission: { select: { userId: true, status: true } } },
  });

  if (!director || director.submission.userId !== req.userId) {
    return errorResponse(res, 'Director not found', 404);
  }
  if (director.submission.status !== 'DRAFT') {
    return errorResponse(res, 'Cannot edit a submitted form', 400);
  }

  await prisma.director.delete({ where: { id: directorId } });
  return successResponse(res, null, 'Director removed');
}
