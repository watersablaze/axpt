import { z } from 'zod';
import { InitiativeStatus } from './constants';

const numberFromStringOrNumber = z.union([z.string(), z.number()]).transform((v, ctx) => {
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  if (!Number.isFinite(n)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid number' });
    return z.NEVER;
  }
  return n;
});

export const InitiativeUpsertSchema = z.object({
  slug: z.string().trim().min(3).max(64),
  name: z.string().trim().min(3).max(140),
  category: z.string().trim().min(2).max(60),
  status: z.nativeEnum(InitiativeStatus as any).optional(),
  description: z.string().trim().max(100000).optional(),
  heroImageUrl: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  fundingGoal: numberFromStringOrNumber.refine((n) => n >= 0, { message: 'Goal must be ≥ 0' }),
  metrics: z.record(z.any()).optional(),
  milestones: z.array(z.record(z.any())).optional(),
});

export type InitiativeUpsertInput = z.infer<typeof InitiativeUpsertSchema>;

export const FundingCreateSchema = z.object({
  amount: numberFromStringOrNumber.refine((n) => n > 0, { message: 'Amount must be > 0' }),
  note: z.string().trim().max(2000).optional(),
});
export type FundingCreateInput = z.infer<typeof FundingCreateSchema>;