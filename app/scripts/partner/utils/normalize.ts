// File: app/scripts/partner/utils/normalize.ts

/**
 * Normalize a partner name by trimming and hyphenating.
 * Example: "The Kingdom Collective" → "The-Kingdom-Collective"
 */
export function normalizePartner(name: string): string {
  return name.trim().replace(/\s+/g, '-');
}