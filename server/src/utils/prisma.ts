/*
 * prisma.ts
 * Prisma client singleton — prevents multiple client instances during hot
 * reloads in development by caching the instance on globalThis; exports
 * a connectDatabase helper that exits the process on connection failure.
 */
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn'] // Verbose query logging in development
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma; // Cache instance to survive hot-module-reload
}

export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (err) {
    logger.error('Database connection failed', err);
    process.exit(1);
  }
}
