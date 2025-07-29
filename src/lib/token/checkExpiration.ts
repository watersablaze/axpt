export function checkTokenExpiration(exp: number): string | null {
  const now = Math.floor(Date.now() / 1000);
  const remaining = exp - now;

  const days = Math.floor(remaining / (60 * 60 * 24));

  if (remaining <= 0) return '❌ Token has expired.';
  if (days <= 3) return `⚠️ Token expires in ${days} day(s). Consider renewing.`;

  return null; // All good
}