// ✅ FILE: lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // Prevent multiple PrismaClient instances in development
  // This globalThis usage ensures compatibility across environments
  var prisma: PrismaClient | undefined;
}

const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'], // Optional: Remove in production if noisy
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;