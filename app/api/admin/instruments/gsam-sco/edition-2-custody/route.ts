import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { loadNeonObjectStorageConfig } from "@/domains/instruments/transaction-documents/neonObjectStorage";
import { createGsamConditionalS3Store } from "@/domains/instruments/transaction-documents/gsamConditionalS3Store";
import { preserveGsamWriteOnceArtifact } from "@/domains/instruments/transaction-documents/gsamWriteOnceCustody";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTRACT = {
  "100:pdf": {
    sha256: "9ed96d9421a6913c971aabeb6b4b48df0b6ac5fd05d8d5c1a46c64175904cf6b",
    bytes: 416705,
  },
  "100:html": {
    sha256: "6d74ac3b817d4bf44bac764abdc1b568a4d842eecfbc52bb20fff5aae2d67037",
    bytes: 4084487,
  },
  "1000:pdf": {
    sha256: "d269fa618be345b4d6bd53a9f713a1af9414b5a0b30d958abdd109949bba92be",
    bytes: 426790,
  },
  "1000:html": {
    sha256: "18e30c384aeb8f31cf98656ccaa8a5353fde3907739a568dc0131542f6172993",
    bytes: 4084494,
  },
} as const;

function respond(error: string, status: number) {
  return NextResponse.json(
    { ok: false, error },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function PUT(request: Request) {
  const principal = await getPrincipal();

  if (!principal) {
    return respond("AUTHENTICATION_REQUIRED", 401);
  }

  if (
    !principal.permissions.includes(
      PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE
    )
  ) {
    return respond("OPERATOR_PERMISSION_REQUIRED", 403);
  }

  // No cross-origin browser uploads.
  const origin = request.headers.get("origin");

  if (
    !origin ||
    origin !== new URL(request.url).origin
  ) {
    return respond("REQUEST_ORIGIN_MISMATCH", 403);
  }

  if (
    request.headers.get("x-gsam-confirm") !==
    "PRESERVE GSAM EDITION 2"
  ) {
    return respond("EXPLICIT_CONFIRMATION_REQUIRED", 400);
  }

  if (
    process.env.GSAM_ED2_CUSTODY_ENABLED !== "enabled"
  ) {
    return respond("GSAM_ED2_CUSTODY_DISABLED", 403);
  }


  const quantity = request.headers.get("x-gsam-quantity");
  const format = request.headers.get("x-gsam-format");

  const identity = `${quantity}:${format}`;
  const artifact = CONTRACT[identity as keyof typeof CONTRACT];

  if (!artifact || (format !== "pdf" && format !== "html")) {
    return respond("UNKNOWN_EDITION_2_ARTIFACT", 400);
  }

  const reportedSize = Number(
    request.headers.get("content-length")
  );

  if (
    !Number.isSafeInteger(reportedSize) ||
    reportedSize !== artifact.bytes
  ) {
    return respond("ARTIFACT_SIZE_MISMATCH", 400);
  }

  // Strict bounds on the accepted payload.
  // These files are individually smaller than 4.5 MB.
  if (reportedSize > 4_300_000) {
    return respond("PAYLOAD_TOO_LARGE", 413);
  }

  let bytes: Uint8Array;

  try {
    bytes = new Uint8Array(await request.arrayBuffer());
  } catch {
    return respond("ARTIFACT_READ_FAILED", 400);
  }

  if (bytes.byteLength !== artifact.bytes) {
    return respond("ARTIFACT_SIZE_MISMATCH", 400);
  }

  const observedHash = createHash("sha256")
    .update(bytes)
    .digest("hex");

  if (observedHash !== artifact.sha256) {
    return respond("ARTIFACT_HASH_MISMATCH", 400);
  }

  const config = loadNeonObjectStorageConfig();

  if (!config) {
    return respond("STORAGE_CONFIGURATION_UNAVAILABLE", 503);
  }

  try {
    const store = createGsamConditionalS3Store(config);

    const result = await preserveGsamWriteOnceArtifact({
      store,
      format,
      expectedSha256: artifact.sha256,
      bytes,
    });

    return NextResponse.json(
      {
        ok: true,
        schema: "GSAM_ED2_ARTIFACT_CUSTODY_RECEIPT_V1",
        reference:
          `GSAM-SCO-PROGRAM-${quantity}MT-2026-002`,
        format,
        bytes: artifact.bytes,
        sha256: result.sha256,
        storageKey: result.key,
        disposition: result.disposition,
        readbackVerified: true,
        registryMutated: false,
        emailSent: false,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return respond("CUSTODY_PRESERVATION_FAILED", 503);
  }
}
