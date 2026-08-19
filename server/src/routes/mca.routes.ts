import { Router } from 'express';
import { searchCompany, getCompanyByCIN, getCompanyFilings } from '../controllers/mca.controller';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Tighter rate limit on external API calls — 60 req / 15 min per IP
const mcaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many MCA lookup requests. Please wait.' },
});

router.use(authenticate, mcaLimiter);

router.get('/company/search', searchCompany);
router.get('/company/:cin', getCompanyByCIN);
router.get('/company/:cin/filings', getCompanyFilings);

export default router;
