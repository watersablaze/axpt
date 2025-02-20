import { PrismaClient } from "@prisma/client"; // ✅ Correct Import

// Prevent multiple instances in development
declare global {
  var prisma: PrismaClient | undefined;
}

// ✅ Create a new Prisma instance only if one doesn't exist
export const prisma = globalThis.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
});

// ✅ Assign instance to global object in development (prevents multiple instances)
if (process.env.NODE_ENV === "development") {
  globalThis.prisma = prisma;
}

// ✅ Retry logic for handling transient database errors
export async function retryQuery<T>(query: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await query();
    } catch (error) {
      console.error(`🚨 Prisma Query Error (Attempt ${attempt + 1} of ${retries}):`, error);
      if (attempt === retries - 1) throw error;
    }
  }
  throw new Error("Prisma query retries failed.");
}