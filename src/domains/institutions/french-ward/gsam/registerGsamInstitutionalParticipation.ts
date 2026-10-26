import type { PrismaClient } from "@prisma/client";

export const GSAM_PARTICIPATION_REFERENCE =
  "FW-GSAM-JV-2026-001" as const;

const identity = {
  reference: GSAM_PARTICIPATION_REFERENCE,
  institutionLegalName:
    "Growthcorp Solutions Asset Management Limited",
  representativeName: "James Crawford",
  representativeCapacity:
    "Authorized Representative via FW–GSAM JV",
  governingBasis: "FW–GSAM Joint Venture Agreement",
  programScope: "Program-based metric-tonne transactions",
  custodialContext: "Commercial and custodial coordination",
} as const;

type Client = Pick<
  PrismaClient,
  "gsamInstitutionalParticipation"
>;

type Record = NonNullable<
  Awaited<
    ReturnType<
      Client["gsamInstitutionalParticipation"]["findUnique"]
    >
  >
>;

function matches(record: Record): boolean {
  return (
    record.reference === identity.reference &&
    record.institutionLegalName === identity.institutionLegalName &&
    record.representativeName === identity.representativeName &&
    record.representativeCapacity ===
      identity.representativeCapacity &&
    record.governingBasis === identity.governingBasis &&
    record.programScope === identity.programScope &&
    record.custodialContext === identity.custodialContext &&
    Boolean(record.createdByUserId?.trim())
  );
}

function reconcile(record: Record) {
  if (!matches(record)) {
    throw new Error(
      "GSAM_INSTITUTIONAL_PARTICIPATION_CONFLICT",
    );
  }

  return {
    record,
    created: false as const,
  };
}

/**
 * Records the operator-declared GSAM institutional relationship.
 *
 * The caller MUST authenticate and authorize the administrator.
 * This function does not admit an ARP participant, assign
 * resources, verify the JV or grant any permissions.
 */
export async function registerGsamInstitutionalParticipation(
  params: {
    client: Client;
    actorUserId: string;
  },
) {
  const actorUserId = params.actorUserId?.trim();

  if (!actorUserId || actorUserId.length > 191) {
    throw new Error("GSAM_REGISTRATION_ACTOR_REQUIRED");
  }

  const table = params.client.gsamInstitutionalParticipation;

  const existing = await table.findUnique({
    where: { reference: identity.reference },
  });

  if (existing) {
    return reconcile(existing);
  }

  try {
    const record = await table.create({
      data: {
        ...identity,
        createdByUserId: actorUserId,
        documentationStatus: "PENDING_REVIEW",
        accessStatus: "NOT_PROVISIONED",
      },
    });

    return {
      record,
      created: true as const,
    };
  } catch (error) {
    // A concurrent request may have inserted this reference.
    // Other failures must propagate without claiming success.
    if (
      !error ||
      typeof error !== "object" ||
      !("code" in error) ||
      error.code !== "P2002" ||
      !("meta" in error) ||
      !error.meta ||
      typeof error.meta !== "object" ||
      !("target" in error.meta) ||
      !Array.isArray(error.meta.target) ||
      !error.meta.target.includes("reference")
    ) {
      throw error;
    }

    const concurrent = await table.findUnique({
      where: { reference: identity.reference },
    });

    if (!concurrent) throw error;

    return reconcile(concurrent);
  }
}
