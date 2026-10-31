/*
 * apiResponse.ts
 * Thin helpers that standardise the JSON shape of every API response —
 * successResponse wraps data with { success: true, message, data } and
 * errorResponse adds optional field-level errors for form validation.
 */
import { Response } from 'express';

export function successResponse(
  res: Response,
  data: unknown,
  message = 'Success',
  statusCode = 200
) {
  return res.status(statusCode).json({ success: true, message, data });
}

export function errorResponse(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: Record<string, string>
) {
  const body: Record<string, unknown> = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}
