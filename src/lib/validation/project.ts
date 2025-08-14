// src/lib/validation/project.ts
import { z } from 'zod';

/** Robust number-ish → number parser. Accepts "123.45" or 123.45. */
const numberFromStringOrNumber = z
  .union([z.string(), z.number()])
  .transform((v, ctx) => {
    const n = typeof v === 'number' ? v : Number((v as string).trim());
    if (!Number.isFinite(n)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid number' });
      return z.NEVER;
    }
    return n;
  });

export const ProjectCreateSchema = z.object({
  title: z.string().trim().min(3, 'Title is too short').max(140, 'Title must be 140 characters or fewer'),
  summary: z.string().trim().min(10, 'Summary is too short').max(20000, 'Summary is too long'),
  requestedAxg: numberFromStringOrNumber
    .refine((n) => n > 0, { message: 'Requested AXG must be greater than 0' })
    .refine((n) => n <= 1_000_000_000, { message: 'Requested AXG is unreasonably high' }),
});

export type ProjectCreateInput = z.infer<typeof ProjectCreateSchema>;