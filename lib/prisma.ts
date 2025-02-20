import { PrismaClient } from "@prisma/client"; // ✅ Correct Import

// ✅ Extend the globalThis type to include `prisma`
declare global {
  var prisma: PrismaClient | undefined;
}

// ✅ Ensure only one instance of PrismaClient is created (prevents multiple connections)
const prismaClient = globalThis.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
});

// ✅ Store Prisma instance in `globalThis` to prevent hot-reloading issues in development
if (process.env.NODE_ENV === "development") {
  globalThis.prisma = prismaClient;
}

// ✅ Retry logic for handling transient database errors
export async function retryQuery<T>(query: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await query();
    } catch (error) {
      console.error(`🚨 Prisma Query Error (Attempt ${attempt + 1} of ${retries}):`, error);
      if (attempt === retries - 1) throw error; // Throw error if max retries reached
    }
  }
  throw new Error("Prisma query retries failed.");
}

// ✅ Export the singleton Prisma instance
export const prisma = prismaClient;