import { PrismaClient } from "@prisma/client";

// Ensure global type safety across hot reloads
declare global {
  var prismaInstance: PrismaClient | undefined;
}

// Create a new Prisma instance only if one doesn’t already exist
const prisma = globalThis.prismaInstance ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
});

// Assign instance to global object in development (prevents multiple instances)
if (process.env.NODE_ENV === "development") {
  globalThis.prismaInstance = prisma;
}

// ✅ Retry logic for handling transient database errors (automatic retries)
export async function retryQuery<T>(query: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await query();
    } catch (error) {
      console.error(`🚨 Prisma Query Error (Attempt ${attempt + 1} of ${retries}):`, error);
      if (attempt === retries - 1) throw error; // Final attempt fails
    }
  }
  throw new Error("Prisma query retries failed.");
}

export { prisma };