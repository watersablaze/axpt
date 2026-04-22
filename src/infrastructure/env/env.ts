import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),

  SIGNING_SECRET: z.string().min(10),

  NEXT_PUBLIC_BASE_URL: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),

  NEXT_PUBLIC_AXPT_STAGE: z
    .enum(["development", "staging", "production"])
    .optional(),
});

export const env = schema.parse(process.env);