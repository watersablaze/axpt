/**
 * FW-BULLETIN-R1 · Editorial V1
 *
 * Existing posts are plain text.
 * New formatted posts use an explicit version marker.
 * No automatic Markdown interpretation of legacy content.
 */

export const BULLETIN_EDITORIAL_V1_PREFIX =
  "\u001eFW-BULLETIN-EDITORIAL-V1\n";

export const BULLETIN_BODY_LIMIT = 12000;

export type BulletinContent =
  | { format: "plain"; text: string }
  | { format: "editorial-v1"; text: string };

export function decodeBulletinBody(
  storedBody: string,
): BulletinContent {
  if (storedBody.startsWith(BULLETIN_EDITORIAL_V1_PREFIX)) {
    return {
      format: "editorial-v1",
      text: storedBody.slice(
        BULLETIN_EDITORIAL_V1_PREFIX.length,
      ),
    };
  }

  return {
    format: "plain",
    text: storedBody,
  };
}

export function encodeEditorialBody(markdown: string): string {
  const body = BULLETIN_EDITORIAL_V1_PREFIX + markdown;

  if (
    !markdown.trim() ||
    body.length > BULLETIN_BODY_LIMIT
  ) {
    throw new Error("FW_BULLETIN_EDITORIAL_BODY_INVALID");
  }

  return body;
}

/**
 * Permit secure external links, email links and relative
 * internal application paths. Never permit protocol-relative
 * paths, script schemes or control characters.
 */
/**
 * Validate the exact body submitted by the publisher.
 * A null result means the server must reject the submission.
 */
export function prepareBulletinSubmission(
  body: unknown,
  format: unknown,
): string | null {
  // HTML form submission may convert textarea LF to CRLF.
  // Canonicalize only submitted string content before validation and storage.
  if (typeof body === "string") {
    body = body.replace(/\r\n?/g, "\n");
  }

  if (typeof body !== "string") return null;

  if (format !== "plain" && format !== "editorial-v1") {
    return null;
  }

  const text = body.trim();
  if (!text) return null;

  if (format === "plain") {
    if (
      text.length > BULLETIN_BODY_LIMIT ||
      text.startsWith(BULLETIN_EDITORIAL_V1_PREFIX)
    ) {
      return null;
    }

    return text;
  }

  if (
    text.length + BULLETIN_EDITORIAL_V1_PREFIX.length >
    BULLETIN_BODY_LIMIT
  ) {
    return null;
  }

  return encodeEditorialBody(text);
}

export function safeBulletinHref(
  href: string | undefined,
): string | undefined {
  if (!href) return undefined;

  if (/[\u0000-\u001f\u007f\\]/.test(href)) {
    return undefined;
  }

  if (
    href.startsWith("/") &&
    !href.startsWith("//")
  ) {
    return href;
  }

  try {
    const url = new URL(href);

    if (
      url.protocol === "https:" ||
      url.protocol === "mailto:"
    ) {
      return href;
    }
  } catch {
    return undefined;
  }

  return undefined;
}
