/**
 * MCA External API Service — PLACEHOLDER (for official government filing)
 *
 * NOTE: Live MCA data lookup (company search, CIN verification, filing history)
 * is already connected via the Finanvo third-party API in:
 *   server/src/services/finanvo/finanvoClient.ts
 *
 * This file is the placeholder for OFFICIAL GOVERNMENT filing submission —
 * a separate integration that requires MCA authorization.
 *
 * This module is the single integration point for officially authorized MCA APIs.
 * All methods are stubs. Replace implementations here when credentials and
 * authorization from the Ministry of Corporate Affairs are obtained.
 *
 * Integration point: replace these stubs with calls to the authorized MCA REST API
 * or any other officially permitted third-party provider.
 *
 * DO NOT scatter MCA-specific logic through the rest of the application.
 */

export interface MCASubmissionPayload {
  referenceNumber: string;
  cin: string;
  formData: Record<string, unknown>;
}

export interface MCASubmissionResult {
  success: boolean;
  srnNumber?: string;
  message: string;
  raw?: unknown;
}

/**
 * Submit a DIR-12 form to the official MCA portal.
 * PLACEHOLDER — not connected to any official API.
 */
export async function submitToOfficialProvider(
  _payload: MCASubmissionPayload
): Promise<MCASubmissionResult> {
  // TODO: Replace with authorized MCA API call
  // Example integration point:
  //   const response = await fetch(process.env.MCA_API_URL + '/dir12', {
  //     method: 'POST',
  //     headers: {
  //       'Authorization': `Bearer ${process.env.MCA_API_KEY}`,
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify(payload),
  //   });
  //   return await response.json();

  return {
    success: false,
    message: 'PLACEHOLDER: MCA official API not yet connected. Awaiting authorized credentials.',
  };
}

/**
 * Verify a company CIN via official provider.
 * PLACEHOLDER.
 */
export async function verifyCIN(_cin: string): Promise<{ valid: boolean; companyName?: string }> {
  return { valid: false };
}

/**
 * Verify a director DIN via official provider.
 * PLACEHOLDER.
 */
export async function verifyDIN(_din: string): Promise<{ valid: boolean; name?: string }> {
  return { valid: false };
}

/**
 * Get payment order for official filing fee.
 * PLACEHOLDER — replace with authorized payment gateway integration.
 */
export async function createPaymentOrder(
  _amount: number,
  _referenceNumber: string
): Promise<{ orderId: string; paymentUrl: string } | null> {
  return null;
}
