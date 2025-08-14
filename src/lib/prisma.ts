// 📁 lib/prisma.ts

// ✅ Remove any explicit default import, like: import prisma from '@prisma/client';
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: ['error', 'warn'], // Keep minimal logs for production safety
  });

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export { prisma };