/*
 * referenceNumber.ts
 * Generates sequentially-padded demo reference numbers in the format
 * DEMO-DIR12-{year}-{000001} by counting existing non-null referenceNumbers
 * in the database; not collision-safe under high concurrency (demo use only).
 */
import { prisma } from './prisma';

export async function generateReferenceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.submission.count({
    where: {
      referenceNumber: { not: null },
    },
  });
  const seq = String(count + 1).padStart(6, '0'); // Zero-pads to 6 digits, e.g. 000042
  return `DEMO-DIR12-${year}-${seq}`;
}
