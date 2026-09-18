import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient | undefined {
  try {
    const client = new PrismaClient();
    return client;
  } catch {
    return undefined;
  }
}

export const prisma: PrismaClient | undefined = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}