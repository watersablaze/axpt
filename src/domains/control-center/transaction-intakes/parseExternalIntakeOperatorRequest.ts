import type {
  ExternalIntakeCommandInput,
} from "./registerExternalIntakeWithCustody";

export class ExternalIntakeHttpError extends Error {
  constructor(
    readonly reason: string,
    readonly status: number,
  ) {
    super(reason);
    this.name = "ExternalIntakeHttpError";
  }
}

const MAX_REQUEST_BYTES = 26_000_000;
const MAX_PDF_BYTES = 25_000_000;

const textFields = [
  "operationalReference",
  "submitterName",
  "submitterEmail",
  "submitterRole",
  "buyerName",
  "commodity",
  "trialQuantity",
  "monthlyQuantity",
  "destination",
  "originatingCandidateName",
  "deliveryTerms",
  "settlementMethod",
] as const;

const allowedFields = new Set<string>([
  ...textFields,
  "confirmation",
  "evidencePdf",
]);

function fail(reason: string, status = 400): never {
  throw new ExternalIntakeHttpError(reason, status);
}

export function validateExternalIntakeRequest(request: Request) {
  const origin = request.headers.get("origin");

  let destination: URL;
  let source: URL;

  try {
    destination = new URL(request.url);
    if (!origin) fail("REQUEST_ORIGIN_REQUIRED", 403);
    source = new URL(origin!);
  } catch {
    return fail("REQUEST_ORIGIN_INVALID", 403);
  }

  if (
    !["https:", "http:"].includes(destination.protocol) ||
    source.origin !== destination.origin ||
    source.username ||
    source.password ||
    source.pathname !== "/" ||
    source.search ||
    source.hash
  ) {
    fail("REQUEST_ORIGIN_MISMATCH", 403);
  }

  const declaredHost = request.headers.get("host");

  if (declaredHost && declaredHost !== destination.host) {
    fail("REQUEST_HOST_MISMATCH", 403);
  }

  const type = request.headers.get("content-type") ?? "";

  if (
    !/^multipart\/form-data\s*;/i.test(type) ||
    !/;\s*boundary=/i.test(type)
  ) {
    fail("MULTIPART_REQUIRED", 415);
  }

  const length = request.headers.get("content-length");

  if (length !== null) {
    if (!/^\d+$/.test(length)) {
      fail("INVALID_CONTENT_LENGTH");
    }

    if (Number(length) > MAX_REQUEST_BYTES) {
      fail("REQUEST_TOO_LARGE", 413);
    }
  }
}


/**
 * Enforce the actual multipart body limit while streaming.
 * Content-Length is advisory; missing or false declarations
 * cannot bypass this gate.
 */
export async function readBoundedExternalIntakeForm(
  request: Request,
  maxBytes = MAX_REQUEST_BYTES,
): Promise<FormData> {
  if (!request.body) {
    fail("INVALID_FORM_DATA");
  }

  const reader = request.body!.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      total += value.byteLength;

      if (total > maxBytes) {
        fail("REQUEST_TOO_LARGE", 413);
      }

      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const bounded = new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: bytes,
  });

  try {
    return await bounded.formData();
  } catch {
    return fail("INVALID_FORM_DATA");
  }
}

export function parseExternalIntakeOperatorForm(form: FormData): {
  confirmation: string;
  registration: ExternalIntakeCommandInput;
  evidencePdf: File;
} {
  const seen = new Set<string>();

  for (const [name] of form.entries()) {
    if (!allowedFields.has(name) || seen.has(name)) {
      fail("UNEXPECTED_OR_DUPLICATE_FIELD");
    }
    seen.add(name);
  }

  const fields: Record<string, string> = {};

  for (const name of [...textFields, "confirmation"]) {
    const value = form.get(name);

    if (typeof value !== "string") {
      fail("REQUIRED_TEXT_FIELD_MISSING");
    }

    const trimmed = (value as string).trim();

    if (!trimmed || trimmed.length > 2_000) {
      fail("INVALID_TEXT_FIELD");
    }

    fields[name] = trimmed;
  }

  if (
    fields.submitterEmail.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.submitterEmail)
  ) {
    fail("INVALID_SUBMITTER_EMAIL");
  }

  const evidence = form.get("evidencePdf");

  if (!(evidence instanceof File)) {
    fail("EVIDENCE_PDF_REQUIRED");
  }

  const evidencePdf = evidence as File;

  if (
    evidencePdf.size < 5 ||
    evidencePdf.size > MAX_PDF_BYTES ||
    evidencePdf.type !== "application/pdf"
  ) {
    fail("EVIDENCE_PDF_INVALID", 413);
  }

  return {
    confirmation: fields.confirmation,
    registration: {
      operationalReference: fields.operationalReference,
      source: "EXTERNAL_EMAIL",
      submitterName: fields.submitterName,
      submitterEmail: fields.submitterEmail,
      submitterRole: fields.submitterRole,
      buyerName: fields.buyerName,
      commodity: fields.commodity,
      trialQuantity: fields.trialQuantity,
      monthlyQuantity: fields.monthlyQuantity,
      destination: fields.destination,
      originatingCandidateName: fields.originatingCandidateName,
      deliveryTerms: fields.deliveryTerms,
      settlementMethod: fields.settlementMethod,
      evidenceBytes: new Uint8Array(),
    },
    evidencePdf,
  };
}
