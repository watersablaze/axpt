/** Process-local bytes only. Authorization is always performed by the delivery reader.
 * No disk, browser cache, permission decisions, or credential values are retained here.
 */
export function createSupportingDocumentByteCache({
  maximumBytes = 12 * 1024 * 1024, maximumEntries = 3, ttlMs = 60_000, now = Date.now,
}: { maximumBytes?: number; maximumEntries?: number; ttlMs?: number; now?: () => number } = {}) {
  const entries = new Map<string, { bytes: Uint8Array; expiresAt: number; timer: ReturnType<typeof setTimeout> }>();
  let size = 0;
  function remove(key: string) {
    const entry = entries.get(key);
    if (entry) { clearTimeout(entry.timer); size -= entry.bytes.byteLength; entries.delete(key); }
  }
  function prune() {
    const time = now();
    for (const [key, entry] of entries) if (entry.expiresAt <= time) remove(key);
  }
  return {
    get(key: string): Uint8Array | undefined {
      prune();
      const entry = entries.get(key);
      if (!entry) return undefined;
      entries.delete(key); entries.set(key, entry);
      return entry.bytes.slice();
    },
    set(key: string, bytes: Uint8Array) {
      prune(); remove(key);
      if (bytes.byteLength > maximumBytes || maximumEntries < 1 || ttlMs <= 0) return;
      while (entries.size >= maximumEntries || size + bytes.byteLength > maximumBytes) {
        const oldest = entries.keys().next().value;
        if (oldest === undefined) return;
        remove(oldest);
      }
      const timer = setTimeout(() => remove(key), ttlMs);
      timer.unref?.();
      entries.set(key, { bytes: bytes.slice(), expiresAt: now() + ttlMs, timer });
      size += bytes.byteLength;
    },
    clear() { for (const key of entries.keys()) remove(key); },
  };
}
