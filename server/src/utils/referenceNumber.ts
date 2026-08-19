import { prisma } from './prisma';

export async function generateReferenceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.submission.count({
    where: {
      referenceNumber: { not: null },
    },
  });
  const seq = String(count + 1).padStart(6, '0');
  return `DEMO-DIR12-${year}-${seq}`;
}
