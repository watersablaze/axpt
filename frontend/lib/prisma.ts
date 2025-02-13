import { PrismaClient } from '@prisma/client';

// Enable detailed Prisma logs in development for debugging
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Retry logic for handling transient database errors (optional)
async function retryQuery<T>(query: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await query();
    } catch (error) {
      console.error(`Prisma query failed on attempt ${i + 1}:`, error);
      if (i === retries - 1) throw error; // Throw error if retries are exhausted
    }
  }
  throw new Error('Query retries failed.');
}

// Prevent multiple Prisma Client instances in development
declare global {
  // Ensure the global variable persists across hot reloads in development
  var prismaInstance: PrismaClient | undefined;
}

const prismaClient = global.prismaInstance || prisma;
if (process.env.NODE_ENV === 'development') global.prismaInstance = prismaClient;

export { prismaClient as prisma, retryQuery };