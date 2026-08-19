import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { errorResponse } from '../utils/apiResponse';
import { generateSubmissionPdf } from '../services/pdfService';

export async function downloadSubmissionPdf(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  const submission = await prisma.submission.findFirst({
    where: req.userRole === 'ADMIN' ? { id } : { id, userId: req.userId },
    include: {
      company: true,
      directors: true,
      kmps: true,
      attachments: { select: { originalFilename: true, attachmentType: true } },
    },
  });

  if (!submission) return errorResponse(res, 'Submission not found', 404);
  if (!submission.referenceNumber) {
    return errorResponse(res, 'PDF is only available after submission', 400);
  }

  const pdfBuffer = await generateSubmissionPdf({
    referenceNumber: submission.referenceNumber,
    formType: submission.formType,
    status: submission.status,
    submittedAt: submission.submittedAt,
    company: submission.company,
    directors: submission.directors,
    kmps: submission.kmps,
    attachments: submission.attachments,
  });

  const filename = `DEMO_DIR12_${submission.referenceNumber}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  res.end(pdfBuffer);
}
