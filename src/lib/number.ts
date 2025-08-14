// src/lib/number.ts
export function decimalToNumber(val: unknown): number {
  if (typeof val === 'number') return val;
  if (val && typeof val === 'object' && typeof (val as any).toNumber === 'function') {
    return (val as any).toNumber();
  }
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

export const axgFmt = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Handy one-liner if you prefer formatting in-place
export function axgToString(val: unknown) {
  return axgFmt.format(decimalToNumber(val));
}