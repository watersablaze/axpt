export type TimingMaterial = { id: string; label: string; href: string; format: "pdf" | "html" };
export type TimingSample = { status: number | null; headersMs: number; totalMs: number; bytes: number; result: string; serverTiming: string | null };
export type TimingRow = { id: string; label: string; samples: TimingSample[] };

/** GET only; no session extraction, storage writes, or cross-origin requests. */
export async function runCupTiming(input: {
  origin: string; materials: TimingMaterial[]; signal: AbortSignal;
  onRow: (row: TimingRow) => void;
  fetcher?: typeof fetch; clock?: () => number;
}) {
  const origin = new URL(input.origin);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname) || origin.protocol !== 'http:') {
    throw new Error("LOCAL_RUNTIME_REQUIRED");
  }
  if (!input.materials.length || input.materials.length > 20) throw new Error("INVALID_MATERIAL_COUNT");
  const targets = input.materials.map(material => {
    const url = new URL(material.href, origin);
    const api = /^\/api\/(?:admin\/representative-program\/participants\/[^/]+\/workspace-preview|representative\/commercial-utility-packs)\/resources\/[^/]+\/(?:supporting-document|document)$/;
    const reader = /^\/representative\/materials\/[^/]+\/reader$/;
    if (url.origin !== origin.origin || url.username || url.password || url.hash ||
        !(material.format === 'pdf' ? api : reader).test(url.pathname) ||
        (material.format === 'pdf' && url.search !== '?mode=inline')) throw new Error("INVALID_TIMING_TARGET");
    return { material, url };
  });
  const fetcher = input.fetcher ?? fetch;
  const clock = input.clock ?? (() => performance.now());
  const rows: TimingRow[] = [];
  for (const { material, url } of targets) {
    const row: TimingRow = { id: material.id, label: material.label, samples: [] };
    // The immediate repeat is intentional: a full seven-document pass can exceed the byte-cache TTL.
    for (let pass = 0; pass < 2; pass++) {
      if (input.signal.aborted) throw new Error("CHECK_STOPPED");
      const controller = new AbortController();
      const stop = () => controller.abort();
      input.signal.addEventListener('abort', stop, { once: true });
      const timer = setTimeout(stop, 90000);
      const started = clock();
      let status: number | null = null;
      let headersMs = 0;
      try {
        const response = await fetcher(url.href, {
          method: 'GET', credentials: 'same-origin', cache: 'no-store',
          redirect: 'error', signal: controller.signal,
        });
        headersMs = clock() - started;
        status = response.status;
        const bytes = new Uint8Array(await response.arrayBuffer());
        const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
        const valid = material.format === 'pdf'
          ? contentType.startsWith('application/pdf') && bytes.length >= 5 &&
            String.fromCharCode(...bytes.subarray(0, 5)) === '%PDF-'
          : contentType.startsWith('text/html') && bytes.length > 0;
        let serverTiming = response.headers.get('server-timing');
        if (!serverTiming && material.format === 'html' && contentType.startsWith('text/html') && typeof DOMParser !== 'undefined') {
          const document = new DOMParser().parseFromString(new TextDecoder().decode(bytes), 'text/html');
          serverTiming = document.querySelector('meta[name="arp-reader-server-timing"]')?.getAttribute('content') ?? null;
        }
        row.samples.push({ status, headersMs, totalMs: clock() - started, bytes: bytes.length,
          result: response.ok && valid ? 'HTTP/content check passed' : response.ok ? 'Unexpected content' : `HTTP ${status}`,
          serverTiming });
      } catch {
        if (input.signal.aborted) throw new Error("CHECK_STOPPED");
        row.samples.push({ status, headersMs, totalMs: clock() - started, bytes: 0,
          result: controller.signal.aborted ? 'Timed out' : 'Request failed or redirected', serverTiming: null });
      } finally {
        clearTimeout(timer);
        input.signal.removeEventListener('abort', stop);
      }
      input.onRow({ ...row, samples: [...row.samples] });
    }
    rows.push(row);
  }
  return rows;
}
