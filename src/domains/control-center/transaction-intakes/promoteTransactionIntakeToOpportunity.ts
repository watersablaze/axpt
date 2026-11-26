import type { PrismaClient as GeneratedPrismaClient } from "@axpt/source-authority-join";
import { verifySignedPersistedSession } from "@/lib/auth/verifySignedPersistedSession";
import { FRENCH_WARD_INSTITUTIONAL_PROFILE } from "@/domains/institutions/french-ward/canonicalInstitutionalProfile";
import {
  FRENCH_WARD_ACTION,
  resolveFrenchWardActionAuthorityWithClient,
} from "@/domains/institutions/french-ward/governance/resolveFrenchWardActionAuthorityWithClient";

import type { OpportunitySource } from "@/domains/control-center/opportunities/types";

type PromoteTransactionIntakeInput = {
  intakeId: string;
  actorEmail?: string | null;
  expectedMatterId?: string;
};

type PromotedOpportunityResult = {
  intakeId: string;
  intakeReference: string;
  opportunityId: string;
  opportunityTitle: string;
  alreadyPromoted: boolean;
};

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function firstClean(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    const cleaned = clean(value);

    if (cleaned) return cleaned;
  }

  return null;
}

function determineOpportunitySource(input: {
  referralCode: string | null;
  referredByName: string | null;
  sourceUrl: string | null;
  transactionType: string | null;
}): OpportunitySource {
  if (clean(input.referralCode) || clean(input.referredByName)) {
    return "REFERRAL";
  }

  if (clean(input.sourceUrl)) {
    return "WEBSITE";
  }

  const transactionType = clean(input.transactionType)?.toUpperCase() ?? "";

  if (transactionType.includes("LOI")) {
    return "LOI";
  }

  return "INTERNAL";
}

function buildOpportunityTitle(input: {
  reference: string;
  program: string | null;
  commodity: string | null;
  quantity: string | null;
  transactionType: string | null;
  destination: string | null;
}) {
  const parts = [
    clean(input.program),
    clean(input.commodity),
    clean(input.quantity),
    clean(input.transactionType),
    clean(input.destination),
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(" · ");
  }

  return `Transaction Intake ${input.reference}`;
}

function buildOpportunityNotes(input: {
  reference: string;
  submitterName: string;
  submitterEmail: string;
  submitterCompany: string | null;
  submitterRole: string;
  buyerName: string | null;
  sellerName: string | null;
  representedPartyType: string | null;
  representedPartyName: string | null;
  authorizationStatus: string | null;
  program: string | null;
  transactionType: string | null;
  deliveryTerms: string | null;
  settlementMethod: string | null;
  expectedTimeline: string | null;
  commodity: string | null;
  quantity: string | null;
  trialQuantity: string | null;
  monthlyQuantity: string | null;
  origin: string | null;
  destination: string | null;
  financialReadiness: string | null;
  documentsAvailable: string | null;
  refineryPreference: string | null;
  referralCode: string | null;
  referredByName: string | null;
  referredByCompany: string | null;
  referredByEmail: string | null;
  referredByPhone: string | null;
  referredByRole: string | null;
  referralConfirmed: boolean;
  compensationExpectation: string | null;
  supportingNotes: string | null;
  sourceUrl: string | null;
}) {
  const submitterBlock = [
    "SUBMITTER",
    `Name: ${input.submitterName}`,
    `Email: ${input.submitterEmail}`,
    clean(input.submitterCompany) ? `Company: ${input.submitterCompany}` : null,
    `Role: ${input.submitterRole}`,
  ];

  const authorityBlock = [
    "AUTHORITY / REPRESENTATION",
    clean(input.buyerName) ? `Buyer: ${input.buyerName}` : null,
    clean(input.sellerName) ? `Seller: ${input.sellerName}` : null,
    clean(input.representedPartyType) || clean(input.representedPartyName)
      ? `Represented Party: ${[
          input.representedPartyType,
          input.representedPartyName,
        ]
          .map(clean)
          .filter(Boolean)
          .join(" · ")}`
      : null,
    clean(input.authorizationStatus)
      ? `Authorization Status: ${input.authorizationStatus}`
      : null,
  ];

  const commercialBlock = [
    "COMMERCIAL STRUCTURE",
    clean(input.program) ? `Program: ${input.program}` : null,
    clean(input.transactionType)
      ? `Transaction Structure: ${input.transactionType}`
      : null,
    clean(input.deliveryTerms)
      ? `Delivery Terms: ${input.deliveryTerms}`
      : null,
    clean(input.settlementMethod)
      ? `Settlement Method: ${input.settlementMethod}`
      : null,
    clean(input.expectedTimeline)
      ? `Expected Timeline: ${input.expectedTimeline}`
      : null,
  ];

  const commodityBlock = [
    "COMMODITY / ROUTE",
    clean(input.commodity) ? `Commodity: ${input.commodity}` : null,
    clean(input.quantity) ? `Total Quantity: ${input.quantity}` : null,
    clean(input.trialQuantity)
      ? `Trial Quantity: ${input.trialQuantity}`
      : null,
    clean(input.monthlyQuantity)
      ? `Monthly Quantity: ${input.monthlyQuantity}`
      : null,
    clean(input.origin) ? `Origin: ${input.origin}` : null,
    clean(input.destination) ? `Destination: ${input.destination}` : null,
  ];

  const readinessBlock = [
    "COMMERCIAL READINESS",
    clean(input.financialReadiness)
      ? `Financial Readiness: ${input.financialReadiness}`
      : null,
    clean(input.documentsAvailable)
      ? `Readiness Materials: ${input.documentsAvailable}`
      : null,
    clean(input.refineryPreference)
      ? `Refinery Preference: ${input.refineryPreference}`
      : null,
  ];

  const referralBlock = [
    "REPRESENTATIVE / REFERRAL",
    clean(input.referralCode) || clean(input.referredByName)
      ? `Referral: ${[
          input.referralCode,
          input.referredByName,
          input.referredByCompany,
          input.referredByRole,
        ]
          .map(clean)
          .filter(Boolean)
          .join(" · ")}`
      : null,
    clean(input.referredByEmail)
      ? `Representative Email: ${input.referredByEmail}`
      : null,
    clean(input.referredByPhone)
      ? `Representative Phone: ${input.referredByPhone}`
      : null,
    `Referral Confirmed: ${input.referralConfirmed ? "Yes" : "No"}`,
    clean(input.compensationExpectation)
      ? `Compensation Expectation: ${input.compensationExpectation}`
      : null,
  ];

  const sourceBlock = [
    "SOURCE / NOTES",
    clean(input.sourceUrl) ? `Source URL: ${input.sourceUrl}` : null,
    clean(input.supportingNotes)
      ? `Supporting Notes: ${input.supportingNotes}`
      : null,
  ];

  const sections = [
    [`TRANSACTION INTAKE: ${input.reference}`],
    submitterBlock,
    authorityBlock,
    commercialBlock,
    commodityBlock,
    readinessBlock,
    referralBlock,
    sourceBlock,
  ]
    .map((section) => section.filter(Boolean).join("\n"))
    .filter(Boolean);

  return sections.join("\n\n");
}

async function advanceFrenchWardMatter(
  tx: PromotionTransaction,
  intake: { id: string; reference: string },
  opportunityId: string,
  actor: string | null,
  expectedMatterId?: string,
) {
  const origin = await tx.institutionalMatterRecord.findUnique({
    where: { recordKind_recordId: { recordKind: "INTAKE", recordId: intake.id } },
    include: { matter: true },
  });
  const matter = origin?.matter;
  if (!matter || matter.institutionalDomain !== "FRENCH_WARD" ||
      matter.institutionalPrincipal !== "French-Ward, Inc." ||
      matter.coordinationEnvironment !== "AXPT" ||
      matter.matterKind !== "COMMERCIAL_TRANSACTION") {
    if (expectedMatterId) throw new Error("FW_MATTER_PROMOTION_TARGET_MISMATCH");
    return;
  }

  if (expectedMatterId && matter.id !== expectedMatterId) {
    throw new Error("FW_MATTER_PROMOTION_TARGET_MISMATCH");
  }

  if (origin.recordReference !== intake.reference) {
    throw new Error("FW_MATTER_INTAKE_IDENTITY_MISMATCH");
  }
  if (matter.currentRecordKind !== "INTAKE") {
    if (expectedMatterId && (matter.currentRecordKind !== "OPPORTUNITY" ||
        matter.currentRecordId !== opportunityId ||
        matter.currentRecordReference !== opportunityId)) {
      throw new Error("FW_MATTER_PROMOTION_TARGET_MISMATCH");
    }
    return;
  }
  if (matter.currentRecordId !== intake.id || matter.currentRecordReference !== intake.reference) {
    throw new Error("FW_MATTER_CURRENT_RECORD_IDENTITY_MISMATCH");
  }

  const advanced = await tx.institutionalMatter.updateMany({
    where: {
      id: matter.id,
      currentRecordKind: "INTAKE",
      currentRecordId: intake.id,
      currentRecordReference: intake.reference,
    },
    data: {
      currentRecordKind: "OPPORTUNITY",
      currentRecordId: opportunityId,
      currentRecordReference: opportunityId,
    },
  });
  if (advanced.count !== 1) throw new Error("FW_MATTER_ADVANCEMENT_CONFLICT");

  await tx.institutionalMatterRecord.create({
    data: {
      matterId: matter.id,
      recordKind: "OPPORTUNITY",
      recordId: opportunityId,
      recordReference: opportunityId,
      linkedBy: actor,
    },
  });
  await tx.institutionalMatterEvent.create({
    data: {
      matterId: matter.id,
      eventType: "CURRENT_RECORD_ADVANCED",
      actor,
      message: "Matter advanced from Intake to Opportunity.",
      metadata: { intakeId: intake.id, intakeReference: intake.reference, opportunityId },
    },
  });
}

type ExternalPromotionInput = {
  client: Pick<GeneratedPrismaClient, "$transaction">;
  intakeId: string;
  matterId: string;
  adoptionDecisionId: string;
  sessionToken: string;
  signingSecret: Parameters<typeof verifySignedPersistedSession>[1];
};

type PromotionTransaction = Pick<
  GeneratedPrismaClient,
  | "$queryRaw"
  | "session"
  | "frenchWardGoverningOfficer"
  | "transactionIntake"
  | "transactionIntakeEvent"
  | "opportunity"
  | "opportunityEvent"
  | "institutionalMatter"
  | "institutionalMatterRecord"
  | "institutionalMatterEvent"
  | "externalTransactionIntakeAdoption"
>;

export async function authorizeExternalPromotion(
  tx: Pick<PromotionTransaction, "$queryRaw" | "session" | "frenchWardGoverningOfficer">,
  input: Pick<ExternalPromotionInput, "sessionToken" | "signingSecret">,
) {
  const session = await verifySignedPersistedSession(
    input.sessionToken,
    input.signingSecret,
    async (tokenId) => {
      await tx.$queryRaw`
        SELECT id FROM "Session" WHERE "tokenId" = ${tokenId} FOR UPDATE
      `;
      return tx.session.findUnique({
        where: { tokenId },
        select: {
          userId: true,
          status: true,
          expiresAt: true,
          invalidatedAt: true,
          endedAt: true,
        },
      });
    },
  );
  if (!session?.userId) {
    throw new Error("FW_EXTERNAL_PROMOTION_SESSION_REQUIRED");
  }

  await tx.$queryRaw`
    SELECT id FROM "FrenchWardGoverningOfficer"
    WHERE "userId" = ${session.userId} FOR UPDATE
  `;
  const authority = await resolveFrenchWardActionAuthorityWithClient({
    client: tx,
    userId: session.userId,
    action: FRENCH_WARD_ACTION.PROMOTE_INTAKE_TO_OPPORTUNITY,
  });
  if (!authority.allowed) {
    throw new Error("FW_EXTERNAL_PROMOTION_GOVERNING_AUTHORITY_REQUIRED");
  }

  const grants = await tx.$queryRaw<Array<{ allowed: boolean }>>`
    SELECT true AS allowed
    FROM "UserRole" ur
    JOIN "RolePermission" rp ON rp."roleId" = ur."roleId"
    JOIN "Permission" p ON p.id = rp."permissionId"
    WHERE ur."userId" = ${session.userId}
      AND ur."isActive" = true
      AND ur."revokedAt" IS NULL
      AND p.key = 'TRANSACTION_INTAKE_PROMOTE'
    FOR SHARE OF ur, rp, p
  `;
  if (grants.length === 0) {
    throw new Error("FW_EXTERNAL_PROMOTION_PERMISSION_REQUIRED");
  }

  return session;
}

export async function promoteTransactionIntakeToOpportunity(
  input: PromoteTransactionIntakeInput,
): Promise<PromotedOpportunityResult> {
  const { prisma } = await import("@/lib/prisma");
  return promoteTransactionIntakeToOpportunityWithClient(prisma, input);
}

export async function promoteTransactionIntakeToOpportunityWithClient(
  client: Pick<GeneratedPrismaClient, "$transaction">,
  input: PromoteTransactionIntakeInput,
): Promise<PromotedOpportunityResult> {
  return client.$transaction((tx: PromotionTransaction) => promoteIntake(tx, input));
}

export async function promoteAdoptedExternalTransactionIntakeToOpportunity(
  input: ExternalPromotionInput,
): Promise<PromotedOpportunityResult> {
  return input.client.$transaction(async (tx: PromotionTransaction) => {
    const session = await authorizeExternalPromotion(tx, input);
    return promoteIntake(
      tx,
      {
        intakeId: input.intakeId,
        expectedMatterId: input.matterId,
        actorEmail: session.email,
      },
      { decisionId: input.adoptionDecisionId, actorUserId: session.userId },
    );
  });
}

async function promoteIntake(
  tx: PromotionTransaction,
  { intakeId, actorEmail, expectedMatterId }: PromoteTransactionIntakeInput,
  adoption?: { decisionId: string; actorUserId: string },
): Promise<PromotedOpportunityResult> {
  await tx.$queryRaw`SELECT id FROM "TransactionIntake" WHERE id = ${intakeId} FOR UPDATE`;
  const intake = await tx.transactionIntake.findUnique({
    where: {
      id: intakeId,
    },
    include: {
      promotedOpportunity: true,
    },
  });

  if (!intake) {
    throw new Error("TRANSACTION_INTAKE_NOT_FOUND");
  }

  // FW-TXN-1B.8B: documentary registration is not
  // independent commercial promotion authority.
  const externalRegistration =
    await tx.transactionIntakeEvent.findFirst({
      where: {
        intakeId: intake.id,
        eventType: "EXTERNAL_INTAKE_REGISTERED",
      },
      select: { id: true },
    });

  if (externalRegistration && !adoption) {
    throw new Error("FW_TXN_EXTERNAL_PROMOTION_AUTHORITY_REQUIRED");
  }

  if (adoption) {
    if (!expectedMatterId || !externalRegistration) {
      throw new Error("FW_EXTERNAL_PROMOTION_ADOPTION_MISMATCH");
    }

    await tx.$queryRaw`
      SELECT id FROM "InstitutionalMatter"
      WHERE id = ${expectedMatterId} FOR UPDATE
    `;
    await tx.$queryRaw`
      SELECT id FROM "InstitutionalMatterRecord"
      WHERE "recordKind" = 'INTAKE' AND "recordId" = ${intakeId} FOR UPDATE
    `;

    const decision = await tx.externalTransactionIntakeAdoption.findUnique({
      where: { intakeId },
    });
    const binding = await tx.institutionalMatterRecord.findUnique({
      where: { recordKind_recordId: { recordKind: "INTAKE", recordId: intakeId } },
    });
    const principalReference = FRENCH_WARD_INSTITUTIONAL_PROFILE.reference;

    if (
      !decision ||
      decision.id !== adoption.decisionId ||
      decision.matterId !== expectedMatterId ||
      decision.canonicalPrincipalReference !== principalReference ||
      decision.externalRegistrationEventId !== externalRegistration.id ||
      !binding ||
      binding.matterId !== expectedMatterId ||
      binding.recordReference !== intake.reference ||
      binding.canonicalPrincipalReference !== principalReference ||
      !binding.canonicalBindingEvidenceReference
    ) {
      throw new Error("FW_EXTERNAL_PROMOTION_ADOPTION_MISMATCH");
    }
  }

  if (intake.promotedOpportunityId) {
    if (!intake.promotedOpportunity) {
      throw new Error("PROMOTED_OPPORTUNITY_NOT_FOUND");
    }

    await advanceFrenchWardMatter(tx, intake, intake.promotedOpportunity.id, actorEmail ?? null, expectedMatterId);

    return {
      intakeId: intake.id,
      intakeReference: intake.reference,
      opportunityId: intake.promotedOpportunity.id,
      opportunityTitle: intake.promotedOpportunity.title,
      alreadyPromoted: true,
    };
  }

  if (intake.status !== "QUALIFIED") {
    throw new Error("TRANSACTION_INTAKE_NOT_QUALIFIED");
  }

  const representedPartyType =
    clean(intake.representedPartyType)?.toUpperCase() ?? null;

  const buyerName =
    representedPartyType === "BUYER"
      ? firstClean(intake.representedPartyName, intake.buyerName)
      : clean(intake.buyerName);

  const sellerName =
    representedPartyType === "SELLER"
      ? firstClean(intake.representedPartyName, intake.sellerName)
      : clean(intake.sellerName);

  const quantityKg = firstClean(
    intake.quantity,
    intake.trialQuantity,
    intake.monthlyQuantity,
  );

  const title = buildOpportunityTitle({
    reference: intake.reference,
    program: intake.program,
    commodity: intake.commodity,
    quantity: quantityKg,
    transactionType: intake.transactionType,
    destination: intake.destination,
  });

  const source = determineOpportunitySource({
    referralCode: intake.referralCode,
    referredByName: intake.referredByName,
    sourceUrl: intake.sourceUrl,
    transactionType: intake.transactionType,
  });

  const opportunity = await tx.opportunity.create({
    data: {
      title,
      source,
      status: "INTAKE",
      commodity: clean(intake.commodity),
      buyerName,
      sellerName,
      origin: clean(intake.origin),
      destination: clean(intake.destination),
      quantityKg,
      notes: buildOpportunityNotes({
        reference: intake.reference,
        submitterName: intake.submitterName,
        submitterEmail: intake.submitterEmail,
        submitterCompany: intake.submitterCompany,
        submitterRole: intake.submitterRole,
        buyerName,
        sellerName,
        representedPartyType: intake.representedPartyType,
        representedPartyName: intake.representedPartyName,
        authorizationStatus: intake.authorizationStatus,
        program: intake.program,
        transactionType: intake.transactionType,
        deliveryTerms: intake.deliveryTerms,
        settlementMethod: intake.settlementMethod,
        expectedTimeline: intake.expectedTimeline,
        commodity: intake.commodity,
        quantity: intake.quantity,
        trialQuantity: intake.trialQuantity,
        monthlyQuantity: intake.monthlyQuantity,
        origin: intake.origin,
        destination: intake.destination,
        financialReadiness: intake.financialReadiness,
        documentsAvailable: intake.documentsAvailable,
        refineryPreference: intake.refineryPreference,
        referralCode: intake.referralCode,
        referredByName: intake.referredByName,
        referredByCompany: intake.referredByCompany,
        referredByEmail: intake.referredByEmail,
        referredByPhone: intake.referredByPhone,
        referredByRole: intake.referredByRole,
        referralConfirmed: intake.referralConfirmed,
        compensationExpectation: intake.compensationExpectation,
        supportingNotes: intake.supportingNotes,
        sourceUrl: intake.sourceUrl,
      }),
    },
  });

  await tx.opportunityEvent.create({
    data: {
      opportunityId: opportunity.id,
      type: "OPPORTUNITY_CREATED",
      actor: actorEmail ?? null,
      message: "Opportunity promoted from transaction intake.",
      metadata: {
        source: "transaction-intake.promotion",
        ...(adoption ? {
          adoptionDecisionId: adoption.decisionId,
          actorUserId: adoption.actorUserId,
        } : {}),
        intakeId: intake.id,
        intakeReference: intake.reference,
        intakeStatus: intake.status,
        opportunitySource: source,
      },
    },
  });

  await tx.transactionIntake.update({
    where: {
      id: intake.id,
    },
    data: {
      status: "PROMOTED_TO_OPPORTUNITY",
      promotedOpportunityId: opportunity.id,
      promotedAt: new Date(),
      promotedBy: actorEmail ?? null,
    },
  });

  await tx.transactionIntakeEvent.create({
    data: {
      intakeId: intake.id,
      eventType: "PROMOTED_TO_OPPORTUNITY",
      fromStatus: intake.status,
      toStatus: "PROMOTED_TO_OPPORTUNITY",
      actor: actorEmail ?? null,
      note: `Promoted to opportunity ${opportunity.title}.`,
    },
  });

  await advanceFrenchWardMatter(tx, intake, opportunity.id, actorEmail ?? null, expectedMatterId);

  return {
    intakeId: intake.id,
    intakeReference: intake.reference,
    opportunityId: opportunity.id,
    opportunityTitle: opportunity.title,
    alreadyPromoted: false,
  };
}
