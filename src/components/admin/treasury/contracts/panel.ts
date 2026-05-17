// src/components/admin/treasury/contracts/panel.ts

export type Nullable<T> = T | null | undefined

export function normalizeRows<T>(
  data: Nullable<T[]>
): T[] {
  return Array.isArray(data) ? data : []
}

export function normalizeObject<T extends object>(
  data: Nullable<Partial<T>>,
  defaults: T
): T {
  return {
    ...defaults,
    ...data,
  }
}

export function normalizeBoolean(
  value: unknown,
  fallback = false
): boolean {
  return typeof value === 'boolean'
    ? value
    : fallback
}

export function normalizeNumber(
  value: unknown,
  fallback = 0
): number {
  return typeof value === 'number'
    ? value
    : fallback
}

export function normalizeString(
  value: unknown,
  fallback = ''
): string {
  return typeof value === 'string'
    ? value
    : fallback
}