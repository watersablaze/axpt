// 📁 src/lib/token/getPdfPath.ts

export const ALLOWED_DOCS = ['whitepaper', 'hemp', 'chinje'] as const;
export type AllowedDoc = typeof ALLOWED_DOCS[number];

/**
 * Returns the PDF path for a known allowed document slug
 */
export function getPdfPath(slug: AllowedDoc): string {
  return `/docs/AXPT/${slug}.pdf`;
}

/**
 * Safely checks if a slug is part of ALLOWED_DOCS
 */
export function isAllowedDoc(slug: string): slug is AllowedDoc {
  return (ALLOWED_DOCS as readonly string[]).includes(slug.trim().toLowerCase());
}

/**
 * Attempts to resolve a PDF path from any given slug safely.
 * Returns null if not allowed.
 */
export function tryGetPdfPath(slug: string): string | null {
  const normalized = slug.trim().toLowerCase();
  return isAllowedDoc(normalized) ? getPdfPath(normalized) : null;
}