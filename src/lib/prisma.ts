// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // Prevent multiple instances in development
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ['query'], // Optional: log SQL queries
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;