import { Router } from 'express';
import {
  createSubmission,
  listSubmissions,
  getSubmission,
  updateSubmission,
  submitSubmission,
  deleteSubmission,
  getSubmissionStatus,
  getStatusHistory,
} from '../controllers/submission.controller';
import { addDirector, updateDirector, deleteDirector } from '../controllers/director.controller';
import { addKMP, updateKMP, deleteKMP } from '../controllers/kmp.controller';
import {
  uploadAttachment,
  listAttachments,
  deleteAttachment,
  downloadAttachment,
} from '../controllers/attachment.controller';
import { downloadSubmissionPdf } from '../controllers/pdf.controller';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

// Submissions
router.post('/', createSubmission);
router.get('/', listSubmissions);
router.get('/:id', getSubmission);
router.put('/:id', updateSubmission);
router.delete('/:id', deleteSubmission);
router.post('/:id/submit', submitSubmission);
router.get('/:id/status', getSubmissionStatus);
router.get('/:id/history', getStatusHistory);
router.get('/:id/pdf', downloadSubmissionPdf);

// Directors
router.post('/:id/directors', addDirector);
router.put('/directors/:directorId', updateDirector);
router.delete('/directors/:directorId', deleteDirector);

// KMP
router.post('/:id/kmp', addKMP);
router.put('/kmp/:kmpId', updateKMP);
router.delete('/kmp/:kmpId', deleteKMP);

// Attachments
router.post('/:id/attachments', upload.single('file'), uploadAttachment);
router.get('/:id/attachments', listAttachments);
router.delete('/attachments/:attachmentId', deleteAttachment);
router.get('/attachments/:attachmentId/download', downloadAttachment);

export default router;
