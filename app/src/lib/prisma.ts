// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // Avoid multiple instances in development
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;