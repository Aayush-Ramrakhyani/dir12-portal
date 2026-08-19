import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { generateReferenceNumber } from '../utils/referenceNumber';
import { createAuditLog } from '../middleware/auditLog';

export async function createSubmission(req: AuthenticatedRequest, res: Response) {
  const submission = await prisma.submission.create({
    data: {
      userId: req.userId!,
      formType: 'DIR-12',
      status: 'DRAFT',
      currentStep: 1,
    },
  });

  await createAuditLog({
    userId: req.userId,
    submissionId: submission.id,
    action: 'SUBMISSION_CREATED',
    description: 'New DIR-12 submission draft created',
    req,
  });

  return successResponse(res, submission, 'Submission created', 201);
}

export async function listSubmissions(req: AuthenticatedRequest, res: Response) {
  const submissions = await prisma.submission.findMany({
    where: { userId: req.userId },
    include: {
      company: { select: { cin: true, companyName: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  return successResponse(res, submissions);
}

export async function getSubmission(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const submission = await prisma.submission.findFirst({
    where: { id, userId: req.userId },
    include: {
      company: true,
      directors: true,
      kmps: true,
      attachments: true,
      declarations: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  if (!submission) return errorResponse(res, 'Submission not found', 404);
  return successResponse(res, submission);
}

export async function updateSubmission(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { currentStep, company, directors, kmps } = req.body;

  const existing = await prisma.submission.findFirst({
    where: { id, userId: req.userId },
  });
  if (!existing) return errorResponse(res, 'Submission not found', 404);
  if (existing.status !== 'DRAFT') {
    return errorResponse(res, 'Cannot edit a submitted form', 400);
  }

  // Update step and company in transaction
  await prisma.$transaction(async (tx) => {
    if (currentStep !== undefined) {
      await tx.submission.update({ where: { id }, data: { currentStep } });
    }

    if (company) {
      await tx.company.upsert({
        where: { submissionId: id },
        create: { submissionId: id, ...company },
        update: { ...company },
      });
    }

    if (directors) {
      for (const dir of directors) {
        if (dir.id) {
          await tx.director.update({ where: { id: dir.id }, data: { ...dir } });
        } else {
          await tx.director.create({ data: { submissionId: id, ...dir } });
        }
      }
    }

    if (kmps) {
      for (const kmp of kmps) {
        if (kmp.id) {
          await tx.kMP.update({ where: { id: kmp.id }, data: { ...kmp } });
        } else {
          await tx.kMP.create({ data: { submissionId: id, ...kmp } });
        }
      }
    }
  });

  const updated = await prisma.submission.findUnique({
    where: { id },
    include: { company: true, directors: true, kmps: true, attachments: true },
  });

  await createAuditLog({
    userId: req.userId,
    submissionId: id,
    action: 'SUBMISSION_UPDATED',
    description: `Submission draft updated at step ${currentStep}`,
    req,
  });

  return successResponse(res, updated, 'Draft saved');
}

export async function submitSubmission(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  const submission = await prisma.submission.findFirst({
    where: { id, userId: req.userId },
    include: { company: true, directors: true },
  });

  if (!submission) return errorResponse(res, 'Submission not found', 404);
  if (submission.status !== 'DRAFT') {
    return errorResponse(res, 'Submission already submitted', 400);
  }

  if (!submission.company) {
    return errorResponse(res, 'Company details are required before submission', 400);
  }

  if (submission.directors.length === 0) {
    return errorResponse(res, 'At least one director is required', 400);
  }

  const refNumber = await generateReferenceNumber();

  await prisma.$transaction(async (tx) => {
    await tx.submission.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        referenceNumber: refNumber,
        submittedAt: new Date(),
        currentStep: 8,
      },
    });

    await tx.statusHistory.create({
      data: {
        submissionId: id,
        oldStatus: 'DRAFT',
        newStatus: 'SUBMITTED',
        changedBy: req.userId!,
        comment: 'Form submitted by user',
      },
    });
  });

  await createAuditLog({
    userId: req.userId,
    submissionId: id,
    action: 'SUBMISSION_SUBMITTED',
    description: `Submission submitted with reference ${refNumber}`,
    req,
  });

  return successResponse(res, { referenceNumber: refNumber }, 'Submission successful');
}

export async function deleteSubmission(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const submission = await prisma.submission.findFirst({
    where: { id, userId: req.userId },
  });
  if (!submission) return errorResponse(res, 'Submission not found', 404);
  if (submission.status !== 'DRAFT') {
    return errorResponse(res, 'Cannot delete a submitted form', 400);
  }

  await prisma.submission.delete({ where: { id } });
  return successResponse(res, null, 'Draft deleted');
}

export async function getSubmissionStatus(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const submission = await prisma.submission.findFirst({
    where: { id, userId: req.userId },
    select: { id: true, status: true, referenceNumber: true, submittedAt: true, updatedAt: true },
  });
  if (!submission) return errorResponse(res, 'Submission not found', 404);
  return successResponse(res, submission);
}

export async function getStatusHistory(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const submission = await prisma.submission.findFirst({
    where: { id, userId: req.userId },
  });
  if (!submission) return errorResponse(res, 'Submission not found', 404);

  const history = await prisma.statusHistory.findMany({
    where: { submissionId: id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
  });
  return successResponse(res, history);
}
