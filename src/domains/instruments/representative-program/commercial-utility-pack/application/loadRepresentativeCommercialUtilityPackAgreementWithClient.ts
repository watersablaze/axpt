import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { loadRepresentativeCommercialUtilityPackWithClient } from
  "./loadRepresentativeCommercialUtilityPackWithClient";

type Client = Pick<
  PrismaClient,
  | "representativeProgramParticipant"
  | "commercialUtilityPack"
>;

type Evidence = {
  evidenceType: string;
  subjectType: string;
  uri: string | null;
  contentHash: string | null;
  metadata: unknown;
};

type Participant = {
  id: string;
  onboardingIntake: {
    status: string;
    admittedParticipantId: string | null;
    masterAgreementInstrumentId: string | null;
    masterAgreementInstrument: {
      id: string;
      reference: string;
      kind: string;
      status: string;
      evidence: Evidence[];
    } | null;
  } | null;
};

function confirmed(metadata: unknown) {
  return Boolean(
    metadata &&
    typeof metadata === "object" &&
    !Array.isArray(metadata) &&
    (metadata as Record<string, unknown>)
      .operatorConfirmedAllSignatures === true,
  );
}

/**
 * Read only the signed agreement bound to this user's participant.
 * No storage locator or execution audit is returned to the browser.
 */
export async function loadRepresentativeCommercialUtilityPackAgreementWithClient(
  params: {
    client: Client;
    userId: string;
    resourceReleaseId: string;
    bucket: string;
    read: (key: string) => Promise<Uint8Array>;
    blobHostname?: string;
    readBlob?: (url: string) => Promise<Uint8Array>;
  },
) {
  const id = params.resourceReleaseId.trim();
  if (!id || id.length > 191) return null;

  const pack = await loadRepresentativeCommercialUtilityPackWithClient({
    client: params.client,
    userId: params.userId,
  });
  if (!pack) return null;

  const matches = pack.modules.flatMap(entry =>
    entry.module === "DOCUMENTS"
      ? entry.resources.filter(resource =>
          resource.id === id &&
          resource.resourceType === "INSTITUTIONAL_INSTRUMENT"
        )
      : [],
  );
  if (!matches.length) return null;
  if (matches.length !== 1) {
    throw new Error("[REPRESENTATIVE_CUP_AGREEMENT_RESOURCE_CONTRADICTION]");
  }

  const participants: Participant[] =
    await params.client.representativeProgramParticipant.findMany({
      where: { userId: params.userId.trim() },
      take: 2,
      select: {
        id: true,
        onboardingIntake: {
          select: {
            status: true,
            admittedParticipantId: true,
            masterAgreementInstrumentId: true,
            masterAgreementInstrument: {
              select: {
                id: true,
                reference: true,
                kind: true,
                status: true,
                evidence: {
                  where: {
                    evidenceType: "DOCUMENT",
                    subjectType: "EXECUTION",
                  },
                  select: {
                    evidenceType: true,
                    subjectType: true,
                    uri: true,
                    contentHash: true,
                    metadata: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!participants.length) return null;
  if (participants.length !== 1) {
    throw new Error("[REPRESENTATIVE_CUP_PARTICIPANT_CONTRADICTION]");
  }

  const participant = participants[0];
  const intake = participant.onboardingIntake;
  const agreement = intake?.masterAgreementInstrument;

  if (
    !intake ||
    intake.status !== "ADMITTED" ||
    intake.admittedParticipantId !== participant.id ||
    !agreement ||
    agreement.id !== intake.masterAgreementInstrumentId ||
    agreement.id !== matches[0].resourceId ||
    agreement.kind !== "REPRESENTATIVE_PROGRAM_AGREEMENT" ||
    agreement.status !== "EXECUTED"
  ) return null;

  const documents = agreement.evidence.filter(evidence =>
    evidence.evidenceType === "DOCUMENT" &&
    evidence.subjectType === "EXECUTION" &&
    confirmed(evidence.metadata)
  );
  if (!documents.length) return null;
  if (documents.length !== 1) {
    throw new Error("[REPRESENTATIVE_CUP_AGREEMENT_EVIDENCE_CONTRADICTION]");
  }

  const document = documents[0];
  const hash = document.contentHash?.replace(/^sha256:/i, "").toLowerCase();
  if (!hash || !/^[a-f0-9]{64}$/.test(hash) || !document.uri) return null;

  let bytes: Uint8Array;

  if (document.uri.startsWith("s3://")) {
    const bucket = params.bucket.trim();
    if (!bucket) return null;

    const prefix = `s3://${bucket}/`;
    if (!document.uri.startsWith(prefix)) return null;

    const key = document.uri.slice(prefix.length);
    if (
      !key ||
      key.startsWith("/") ||
      key.split("/").some(segment => segment === "." || segment === "..") ||
      /[\u0000-\u001f\u007f]/.test(key)
    ) return null;

    bytes = await params.read(key);
  } else {
    let locator: URL;
    try {
      locator = new URL(document.uri);
    } catch {
      return null;
    }

    const hostname = params.blobHostname?.trim().toLowerCase();
    if (
      !hostname ||
      !hostname.endsWith(".private.blob.vercel-storage.com") ||
      locator.protocol !== "https:" ||
      locator.hostname !== hostname ||
      locator.port ||
      locator.username ||
      locator.password ||
      locator.search ||
      locator.hash ||
      locator.pathname === "/" ||
      !params.readBlob
    ) return null;

    bytes = await params.readBlob(locator.href);
  }
  if (
    Buffer.from(bytes.subarray(0, 5)).toString("ascii") !== "%PDF-" ||
    createHash("sha256").update(bytes).digest("hex") !== hash
  ) {
    throw new Error("[REPRESENTATIVE_CUP_AGREEMENT_INTEGRITY_FAILED]");
  }

  return {
    bytes,
    reference: agreement.reference,
    canDownload: matches[0].canDownload,
  };
}
