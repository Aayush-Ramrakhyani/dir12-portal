import { Router } from 'express';
import {
  listUsers,
  toggleUserStatus,
  listAllSubmissions,
  adminGetSubmission,
  updateSubmissionStatus,
  listAuditLogs,
  adminDashboardStats,
} from '../controllers/admin.controller';
import { downloadSubmissionPdf } from '../controllers/pdf.controller';
import { downloadAttachment } from '../controllers/attachment.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/stats', adminDashboardStats);
router.get('/users', listUsers);
router.put('/users/:userId/toggle-status', toggleUserStatus);
router.get('/submissions', listAllSubmissions);
router.get('/submissions/:id', adminGetSubmission);
router.put('/submissions/:id/status', updateSubmissionStatus);
router.get('/submissions/:id/pdf', downloadSubmissionPdf);
router.get('/attachments/:attachmentId/download', downloadAttachment);
router.get('/audit-logs', listAuditLogs);

export default router;
