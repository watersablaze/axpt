// lib/utils/safeIncludes.ts
export function safeIncludes(val: unknown, search: string): boolean {
  return (
    (typeof val === 'string' && val.includes(search)) ||
    (Array.isArray(val) && val.includes(search)) ||
    false
  );
}    