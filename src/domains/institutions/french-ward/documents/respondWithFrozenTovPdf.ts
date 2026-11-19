/**
 * FW-CD-1A.2: transport-only response mapping.
 * Identity, permission, publication and byte verification remain upstream.
 */
export type AuthorizedTovPdf = Readonly<{
  bytes: Uint8Array;
  filename: string;
  sha256: string;
}>;

export async function respondWithFrozenTovPdf(
  load: () => Promise<AuthorizedTovPdf | null>,
  onError: (error: unknown) => void = () => {},
): Promise<Response> {
  const privateHeaders = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
  };
  try {
    const doc = await load();
    if (!doc) return new Response("Not found", { status: 404, headers: privateHeaders });
    // Do not expose unchecked filenames or arbitrary bytes: caller is the
    // verified custody reader. This contract neither authenticates nor signs.
    if (!/^FW-TOV-2026-001-Edition01-R04\.pdf$/.test(doc.filename) ||
        !/^[a-f0-9]{64}$/.test(doc.sha256) ||
        doc.bytes.byteLength === 0) {
      throw new Error("FW_TOV_HTTP_DESCRIPTOR_INVALID");
    }
    return new Response(new Uint8Array(doc.bytes), {
      status: 200,
      headers: {
        ...privateHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${doc.filename}"`,
        "Content-Length": String(doc.bytes.byteLength),
      },
    });
  } catch (error) {
    onError(error);
    return new Response("Document unavailable", {
      status: 503,
      headers: privateHeaders,
    });
  }
}
