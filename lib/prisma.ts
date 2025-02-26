import { PrismaClient } from "@prisma/client";

// ✅ Declare global variable with correct TypeScript handling
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// ✅ Use `const` instead of `var`
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
  });

// ✅ Store Prisma instance correctly in `globalThis`
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ✅ Prisma Query Retry Logic (Handles transient DB errors)
export async function retryQuery<T>(query: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await query();
    } catch (error: unknown) {
      console.error(`🚨 Prisma Query Error (Attempt ${attempt + 1} of ${retries}):`, error);
      if (attempt === retries - 1) throw error; // Throw error if max retries reached
    }
  }
  throw new Error("Prisma query retries failed.");
}