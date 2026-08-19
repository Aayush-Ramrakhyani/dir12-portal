import { Request, Response } from 'express';
import { finanvoService } from '../services/finanvo/finanvoClient';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

/**
 * GET /api/mca/company/search?q=<name or partial CIN>
 * Returns matching companies from Finanvo (MCA data).
 */
export async function searchCompany(req: Request, res: Response) {
  const q = (req.query.q as string)?.trim();
  if (!q || q.length < 2) {
    return errorResponse(res, 'Search query must be at least 2 characters', 400);
  }

  try {
    const companies = await finanvoService.searchCompanies(q);
    return successResponse(res, companies);
  } catch (err) {
    logger.warn('Finanvo company search failed', { q, err: (err as Error).message });
    return errorResponse(res, 'Company lookup service unavailable', 503);
  }
}

/**
 * GET /api/mca/company/:cin
 * Returns a single company name for a given CIN (used for auto-fill).
 */
export async function getCompanyByCIN(req: Request, res: Response) {
  const cin = req.params.cin?.trim().toUpperCase();
  if (!cin) return errorResponse(res, 'CIN is required', 400);

  try {
    // Use company search with exact CIN — Finanvo search works on CIN too
    const results = await finanvoService.searchCompanies(cin);
    const match = results.find((c) => c.cin === cin) ?? results[0] ?? null;
    return successResponse(res, match);
  } catch (err) {
    logger.warn('Finanvo CIN lookup failed', { cin, err: (err as Error).message });
    return errorResponse(res, 'Company lookup service unavailable', 503);
  }
}

/**
 * GET /api/mca/company/:cin/filings
 * Returns MCA filing history for a CIN — shown on submission detail page.
 */
export async function getCompanyFilings(req: Request, res: Response) {
  const cin = req.params.cin?.trim().toUpperCase();
  if (!cin) return errorResponse(res, 'CIN is required', 400);

  try {
    const result = await finanvoService.getDocumentsByCIN(cin);
    return successResponse(res, result);
  } catch (err) {
    logger.warn('Finanvo CIN docs failed', { cin, err: (err as Error).message });
    return errorResponse(res, 'Filing history service unavailable', 503);
  }
}
