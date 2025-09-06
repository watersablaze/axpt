// src/config/initiatives.ts
// Keep UI & API perfectly in sync.

// ⬇️ If your Prisma enum includes "COMPLETED", keep it here.
// If not, remove "COMPLETED" below (and in your schema OR UI).
export const INITIATIVE_STATUSES = [
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'ARCHIVED',
  'COMPLETED', 
] as const;

export const INITIATIVE_CATEGORIES = [
  'ENERGY',
  'FINTECH',
  'DATA',
  'SECURITY',
  'OTHER',
] as const;

export type InitiativeStatusLiteral = typeof INITIATIVE_STATUSES[number];
export type InitiativeCategoryLiteral = typeof INITIATIVE_CATEGORIES[number];

// Small helper to coerce free text to a safe enum literal
export function coerceEnum<T extends string>(
  val: string,
  allowed: readonly T[],
  fallback: T
): T {
  const up = String(val || '').trim().toUpperCase() as T;
  return (allowed as readonly string[]).includes(up) ? up : fallback;
}