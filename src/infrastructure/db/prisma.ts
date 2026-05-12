import 'server-only'
import { PrismaClient } from "@prisma/client"

declare global {
  var prisma: PrismaClient | undefined
}

function ensureServer() {
  if (typeof window !== "undefined") {
    throw new Error("Prisma cannot run in browser")
  }
}

ensureServer()

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL missing")
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma
}