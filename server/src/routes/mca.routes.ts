/*
 * mca.routes.ts
 * Express router for MCA data lookup endpoints backed by the Finanvo API —
 * applies a dedicated, tighter rate limiter (60 req / 15 min) to all three
 * routes to protect against excessive external API usage.
 */
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

router.use(authenticate, mcaLimiter); // All MCA routes require auth and respect the tighter rate limit

router.get('/company/search', searchCompany);
router.get('/company/:cin', getCompanyByCIN);
router.get('/company/:cin/filings', getCompanyFilings);

export default router;
