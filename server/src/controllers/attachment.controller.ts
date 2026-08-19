import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { createAuditLog } from '../middleware/auditLog';

export async function uploadAttachment(req: AuthenticatedRequest, res: Response) {
  const { id: submissionId } = req.params;

  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, userId: req.userId },
  });
  if (!submission) {
    // remove uploaded file if submission not found
    if (req.file) fs.unlinkSync(req.file.path);
    return errorResponse(res, 'Submission not found', 404);
  }

  if (!req.file) return errorResponse(res, 'No file uploaded', 400);

  const { attachmentType } = req.body;

  const attachment = await prisma.attachment.create({
    data: {
      submissionId,
      originalFilename: req.file.originalname,
      storedFilename: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      attachmentType: attachmentType || 'OPTIONAL',
      uploadedBy: req.userId!,
    },
  });

  await createAuditLog({
    userId: req.userId,
    submissionId,
    action: 'ATTACHMENT_UPLOADED',
    description: `File uploaded: ${req.file.originalname}`,
    req,
  });

  return successResponse(res, attachment, 'File uploaded', 201);
}

export async function listAttachments(req: AuthenticatedRequest, res: Response) {
  const { id: submissionId } = req.params;

  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, userId: req.userId },
  });
  if (!submission) return errorResponse(res, 'Submission not found', 404);

  const attachments = await prisma.attachment.findMany({
    where: { submissionId },
    orderBy: { createdAt: 'asc' },
  });

  return successResponse(res, attachments);
}

export async function deleteAttachment(req: AuthenticatedRequest, res: Response) {
  const { attachmentId } = req.params;

  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId },
    include: {
      submission: { select: { userId: true, status: true } },
    },
  });

  if (!attachment || attachment.submission.userId !== req.userId) {
    return errorResponse(res, 'Attachment not found', 404);
  }

  // Delete file from disk
  try {
    if (fs.existsSync(attachment.path)) {
      fs.unlinkSync(attachment.path);
    }
  } catch {
    // continue even if file is missing
  }

  await prisma.attachment.delete({ where: { id: attachmentId } });

  await createAuditLog({
    userId: req.userId,
    submissionId: attachment.submissionId,
    action: 'ATTACHMENT_DELETED',
    description: `File deleted: ${attachment.originalFilename}`,
    req,
  });

  return successResponse(res, null, 'Attachment deleted');
}

export async function downloadAttachment(req: AuthenticatedRequest, res: Response) {
  const { attachmentId } = req.params;

  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId },
    include: { submission: { select: { userId: true } } },
  });

  // Admins can also download; check userId only for regular users
  if (!attachment) return errorResponse(res, 'Attachment not found', 404);

  const isOwner = attachment.submission.userId === req.userId;
  const isAdmin = req.userRole === 'ADMIN';

  if (!isOwner && !isAdmin) return errorResponse(res, 'Forbidden', 403);

  if (!fs.existsSync(attachment.path)) {
    return errorResponse(res, 'File not found on server', 404);
  }

  res.download(attachment.path, attachment.originalFilename);
}
