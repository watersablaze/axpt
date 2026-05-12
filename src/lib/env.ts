import "server-only"
import { z } from "zod"

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  RPC_URL: z.string().optional(),
  PRIVATE_KEY: z.string().optional(),
  AXG_ESCROW_ADDRESS: z.string().optional(),
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error("❌ ENV VALIDATION FAILED", parsed.error.flatten())
  throw new Error("❌ Invalid environment variables")
}

export const env = parsed.data