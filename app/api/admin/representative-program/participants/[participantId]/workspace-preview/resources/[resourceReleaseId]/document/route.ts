import { isAdmin } from "@/domains/auth/isAdmin";
import { resolveRepresentativeCommercialUtilityPackConsumptionWithClient } from
  "@/domains/instruments/representative-program/commercial-utility-pack/application/resolveRepresentativeCommercialUtilityPackConsumptionWithClient";
import { NextResponse, type NextRequest } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import { createNeonObjectStorage } from
  "@/domains/instruments/transaction-documents/neonObjectStorage";
import { loadRepresentativeCommercialUtilityPackAgreementWithClient } from
  "@/domains/instruments/representative-program/commercial-utility-pack/application/loadRepresentativeCommercialUtilityPackAgreementWithClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ participantId: string; resourceReleaseId: string }> },
) {
  const headers = {
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "same-origin",
  };

  const principal = await getPrincipal();
  if (!principal) {
    return new NextResponse(null, { status: 401, headers });
  }

  if (!isAdmin(principal)) {
    return new NextResponse(null, { status: 403, headers });
  }
  const { participantId, resourceReleaseId } = await context.params;
  if (!participantId || participantId.length > 191) {
    return new NextResponse(null, { status: 400, headers });
  }
  const participant = await prisma.representativeProgramParticipant.findUnique({
    where: { id: participantId },
    select: { userId: true },
  });
  if (!participant?.userId) {
    return new NextResponse(null, { status: 404, headers });
  }
  // Existing execution evidence is stored in this private Blob store.
  const blobHostname = "zjlswvetvtzvn453.private.blob.vercel-storage.com";
  const bucket = process.env.AXPT_TRANSACTION_DOCUMENT_BUCKET?.trim() || "";

  const mode = request.nextUrl.searchParams.get("mode");
  if (mode !== null && mode !== "download" && mode !== "inline") {
    return new NextResponse(null, { status: 400, headers });
  }
  if (mode === "download") {
    return new NextResponse(null, { status: 403, headers });
  }
  const download = false;

  try {
    const consumption =
      await resolveRepresentativeCommercialUtilityPackConsumptionWithClient({
        client: prisma,
        userId: participant.userId,
        resourceReleaseId,
        action: download ? "DOWNLOAD" : "VIEW",
      });

    if (!consumption.allowed) {
      return new NextResponse(null, {
        status: consumption.reason === "RESOURCE_UNAVAILABLE" ? 404 : 403,
        headers,
      });
    }

    const agreement =
      await loadRepresentativeCommercialUtilityPackAgreementWithClient({
        client: prisma,
        userId: participant.userId,
        resourceReleaseId,
        bucket,
        read: async key => {
          const store = createNeonObjectStorage();
          if (!store) {
            throw new Error("[REPRESENTATIVE_CUP_PRIVATE_STORAGE_UNAVAILABLE]");
          }
          return store.read(key);
        },
        blobHostname,
        readBlob: async url => {
          const locator = new URL(url);
          if (
            locator.protocol !== "https:" ||
            locator.hostname !== blobHostname ||
            locator.port ||
            locator.username ||
            locator.password ||
            locator.search ||
            locator.hash
          ) {
            throw new Error("[REPRESENTATIVE_CUP_PRIVATE_LOCATOR_INVALID]");
          }

          const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
          if (!token || token.includes("[SENSITIVE]")) {
            throw new Error("[REPRESENTATIVE_CUP_PRIVATE_STORAGE_UNAVAILABLE]");
          }

          const response = await fetch(locator.href, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
            redirect: "error",
            signal: AbortSignal.timeout(15000),
          });

          if (!response.ok) {
            throw new Error("[REPRESENTATIVE_CUP_PRIVATE_STORAGE_READ_FAILED]");
          }

          return new Uint8Array(await response.arrayBuffer());
        },
      });

    if (!agreement) {
      return new NextResponse(null, { status: 404, headers });
    }

    // Preserve the content loader's permission check as well.
    if (download && !agreement.canDownload) {
      return new NextResponse(null, { status: 403, headers });
    }

    const fileName =
      `${agreement.reference}.pdf`.replace(/[^a-zA-Z0-9._-]/g, "_");

    return new NextResponse(Buffer.from(agreement.bytes), {
      status: 200,
      headers: {
        ...headers,
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `${download ? "attachment" : "inline"}; filename="${fileName}"`,
        "Content-Length": String(agreement.bytes.byteLength),
      },
    });
  } catch {
    console.error("[REPRESENTATIVE_CUP_AGREEMENT_READ_FAILED]");
    return new NextResponse(null, { status: 503, headers });
  }
}
