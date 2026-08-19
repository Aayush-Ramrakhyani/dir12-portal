import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { successResponse, errorResponse } from '../utils/apiResponse';

export async function addKMP(req: AuthenticatedRequest, res: Response) {
  const { id: submissionId } = req.params;

  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, userId: req.userId },
  });
  if (!submission) return errorResponse(res, 'Submission not found', 404);
  if (submission.status !== 'DRAFT') {
    return errorResponse(res, 'Cannot edit a submitted form', 400);
  }

  const kmp = await prisma.kMP.create({
    data: { submissionId, ...req.body },
  });

  return successResponse(res, kmp, 'KMP added', 201);
}

export async function updateKMP(req: AuthenticatedRequest, res: Response) {
  const { kmpId } = req.params;

  const kmp = await prisma.kMP.findFirst({
    where: { id: kmpId },
    include: { submission: { select: { userId: true, status: true } } },
  });

  if (!kmp || kmp.submission.userId !== req.userId) {
    return errorResponse(res, 'KMP not found', 404);
  }
  if (kmp.submission.status !== 'DRAFT') {
    return errorResponse(res, 'Cannot edit a submitted form', 400);
  }

  const updated = await prisma.kMP.update({ where: { id: kmpId }, data: req.body });
  return successResponse(res, updated, 'KMP updated');
}

export async function deleteKMP(req: AuthenticatedRequest, res: Response) {
  const { kmpId } = req.params;

  const kmp = await prisma.kMP.findFirst({
    where: { id: kmpId },
    include: { submission: { select: { userId: true, status: true } } },
  });

  if (!kmp || kmp.submission.userId !== req.userId) {
    return errorResponse(res, 'KMP not found', 404);
  }
  if (kmp.submission.status !== 'DRAFT') {
    return errorResponse(res, 'Cannot edit a submitted form', 400);
  }

  await prisma.kMP.delete({ where: { id: kmpId } });
  return successResponse(res, null, 'KMP removed');
}
