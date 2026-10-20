/** Numeric development diagnostics only. No identifiers or credentials are emitted. */
export function createLocalReadTiming() {
  const enabled = process.env.NODE_ENV === "development";
  const start = performance.now();
  const durations = new Map<string, number>();
  return {
    record(name: string, milliseconds: number) {
      if (enabled) durations.set(name, (durations.get(name) ?? 0) + milliseconds);
    },
    async measure<T>(name: string, operation: () => Promise<T>): Promise<T> {
      const began = performance.now();
      try { return await operation(); }
      finally { if (enabled) durations.set(name, (durations.get(name) ?? 0) + performance.now() - began); }
    },
    value() {
      if (!enabled) return "";
      return [...durations, ["total", performance.now() - start] as [string, number]]
        .map(([name, ms]) => `${name};dur=${ms.toFixed(1)}`).join(", ");
    },
    headers(): Record<string, string> { const value = this.value(); return value ? { "Server-Timing": value } : {}; },
  };
}
