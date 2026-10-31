/*
 * finanvoClient.ts
 * Singleton service client for the Finanvo third-party MCA data API
 * (api5.finanvo.in) — manages JWT auth with automatic re-login before the
 * 30-minute token expires, and exposes company search and CIN filing-history
 * lookup used throughout the portal.
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../../config';
import { logger } from '../../utils/logger';

export interface FinanvoCompany {
  cin: string;
  name: string;
}

export interface FinanvoDocument {
  ref_key: string;
  formId: string;
  fileName: string;
  doc_name: string | null;
  year: string;
  dateOfFiling: string;
  documentCategory: string;
  description: string;
  numberOfPages: string;
  fileSize: string;
  paymentDate: string;
  fileType: string;
  dscUploadDate: string;
}

class FinanvoService {
  private http: AxiosInstance;
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.http = axios.create({
      baseURL: config.finanvo.baseUrl,
      timeout: config.finanvo.timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'app-origin': 'https://mcadownload.com',
      },
    });
  }

  private async ensureAuthenticated(): Promise<void> {
    // Re-login if no token or within 2 minutes of expiry
    if (!this.token || Date.now() >= this.tokenExpiresAt - 120_000) {
      await this.login();
    }
  }

  private async login(): Promise<void> {
    if (!config.finanvo.email || !config.finanvo.password) {
      throw new Error('Finanvo credentials not configured in environment variables');
    }

    const res = await this.http.post('/user/login', {
      email: config.finanvo.email,
      password: config.finanvo.password,
    });

    // Confirmed shape: res.data.data.token
    const token = res.data?.data?.token;
    if (!token || typeof token !== 'string') {
      throw new Error('Finanvo login failed: token not found in response');
    }

    this.token = token;
    // Token is valid for 30 minutes — store expiry 2 min early to refresh proactively
    this.tokenExpiresAt = Date.now() + 28 * 60 * 1000;
    logger.info('Finanvo: authenticated successfully');
  }

  private authHeaders() {
    return {
      Authorization: this.token!,
      'app-origin': 'https://mcadownload.com',
    };
  }

  /**
   * Search companies by name or partial CIN.
   * Returns array of { cin, name }.
   */
  async searchCompanies(query: string): Promise<FinanvoCompany[]> {
    await this.ensureAuthenticated();

    const res = await this.http.get('/search/company', {
      params: { query: query.trim() },
      headers: this.authHeaders(),
    });

    // Confirmed shape: res.data.data = [{ dataid: CIN, name: string }]
    const rawList: Array<{ dataid: string; name: string }> = res.data?.data ?? [];
    return rawList.map((item) => ({
      cin: item.dataid,
      name: item.name,
    }));
  }

  /**
   * Get all MCA filings for a given CIN.
   */
  async getDocumentsByCIN(cin: string): Promise<{ cin: string; docs: FinanvoDocument[] }> {
    await this.ensureAuthenticated();

    const res = await this.http.get('/company/cin-docs', {
      params: { cin: cin.trim().toUpperCase() },
      headers: this.authHeaders(),
    });

    // Confirmed shape: { cin: string, docs: FinanvoDocument[] }
    return {
      cin: res.data?.cin ?? cin,
      docs: res.data?.docs ?? [],
    };
  }
}

export const finanvoService = new FinanvoService(); // Singleton — one instance per server process shares the cached token
