// ✅ FILE: app/src/lib/db.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // Allow global reuse of PrismaClient
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'], // optional for debugging
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;