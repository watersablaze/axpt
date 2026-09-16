import { prisma } from "@/lib/prisma";

import { createOpportunityEvent } from "./createOpportunityEvent";

type Input = {
  opportunityId: string;
  operatorEmail: string;
};

type PromotionTransaction = Pick<
  typeof prisma,
  "transactionDossier" | "opportunity" | "transactionDossierEvent"
>;

type DossierPartySeed = {
  role: "BUYER" | "SELLER";
  legalName: string;
  representative?: string | null;
  country?: string | null;
  notes?: string | null;
};

export type OpportunityPromotionResult = {
  opportunityId: string;
  dossierId: string;
  reference: string;
  alreadyPromoted: boolean;
};

function buildDossierReference() {
  const year = new Date().getFullYear();

  return `FWI-AU-OPP-${year}-${Date.now()}`;
}

function normalizeQuantityKg(value: string | null): string | null {
  if (!value) return null;

  const normalized = value.trim().replace(/kg/gi, "").replace(/,/g, "").trim();

  if (!normalized) return null;

  const numericValue = Number(normalized);

  if (!Number.isFinite(numericValue)) {
    throw new Error("OPPORTUNITY_QUANTITY_INVALID");
  }

  return normalized;
}

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildSettlementDescriptor(input: {
  settlementMethod?: string | null;
  settlementPathway?: string | null;
  settlementRail?: string | null;
  settlementCurrencyAsset?: string | null;
  bankMessageFormat?: string | null;
  digitalAsset?: string | null;
  digitalAssetNetwork?: string | null;
}) {
  const modernParts = [
    clean(input.settlementPathway),
    clean(input.settlementRail),
    clean(input.settlementCurrencyAsset),
    clean(input.bankMessageFormat),
    clean(input.digitalAsset),
    clean(input.digitalAssetNetwork),
  ].filter(
    (value, index, values): value is string =>
      Boolean(value) &&
      values.indexOf(value) === index,
  );

  if (modernParts.length > 0) {
    return modernParts.join(" | ");
  }

  return clean(input.settlementMethod);
}

function buildRefineryDescriptor(input: {
  refineryJurisdiction?: string | null;
  refineryPreference?: string | null;
}) {
  return (
    clean(input.refineryJurisdiction) ??
    clean(input.refineryPreference)
  );
}

function inferFinancialInstrumentType(input: {
  settlementMethod: string | null;
  transactionType: string | null;
}) {
  const value = [input.settlementMethod, input.transactionType]
    .map((item) => item?.toUpperCase() ?? "")
    .join(" ");

  if (value.includes("DLC")) return "DLC";
  if (value.includes("SBLC")) return "SBLC";
  if (value.includes("MT103")) return "MT103 Wire";
  if (value.includes("ESCROW")) return "Escrow Settlement";
  if (value.includes("WIRE")) return "Wire Transfer";
  if (value.includes("CASH")) return "Cash Settlement";

  return null;
}

function buildTermsSeed(input: {
  settlementMethod: string | null;
  settlementPathway?: string | null;
  settlementRail?: string | null;
  settlementCurrencyAsset?: string | null;
  bankMessageFormat?: string | null;
  digitalAsset?: string | null;
  digitalAssetNetwork?: string | null;
  transactionType: string | null;
  compensationExpectation: string | null;
  referralCode: string | null;
  referredByName: string | null;
  referredByCompany: string | null;
}) {
  const settlementMethod =
    buildSettlementDescriptor(input);
  const financialInstrumentType = inferFinancialInstrumentType({
    settlementMethod,
    transactionType: clean(input.transactionType),
  });

  const compensationExpectation = clean(input.compensationExpectation);

  const referralSummary = [
    clean(input.referralCode) ? `Referral Code: ${input.referralCode}` : null,
    clean(input.referredByName)
      ? `Representative: ${input.referredByName}`
      : null,
    clean(input.referredByCompany)
      ? `Representative Company: ${input.referredByCompany}`
      : null,
    compensationExpectation
      ? `Compensation Expectation: ${compensationExpectation}`
      : null,
  ].filter(Boolean);

  const hasSeed =
    settlementMethod || financialInstrumentType || referralSummary.length > 0;

  if (!hasSeed) return null;

  return {
    settlementMethod,
    financialInstrumentType,
    compensationConfidentialityNote:
      referralSummary.length > 0
        ? `Seeded from source intake for operator review. ${referralSummary.join(
            " | ",
          )}`
        : null,
  };
}

function buildPartySeeds(input: {
  buyerName: string | null;
  sellerName: string | null;
  sourceIntake?: {
    submitterName: string;
    submitterEmail: string;
    representedPartyType: string | null;
    representedPartyName: string | null;
    submitterCountry: string | null;

    buyerCountryOfIncorporation: string | null;
    buyerRepresentativeName: string | null;
    buyerRepresentativeTitle: string | null;
    buyerRepresentativeEntity: string | null;
    buyerRepresentativeRelationship: string | null;

    authorityToRepresent: boolean;
    authorityToNegotiate: boolean;
    authorityToSign: boolean;
    authorityOther: string | null;

    referredByName: string | null;
    referredByCompany: string | null;
    referralCode: string | null;
  } | null;
}): DossierPartySeed[] {
  const parties: DossierPartySeed[] = [];

  const representedPartyType =
    clean(input.sourceIntake?.representedPartyType)?.toUpperCase() ?? null;

  const representedPartyName = clean(input.sourceIntake?.representedPartyName);

  const buyerName =
    representedPartyType === "BUYER"
      ? (representedPartyName ?? clean(input.buyerName))
      : clean(input.buyerName);

  const sellerName =
    representedPartyType === "SELLER"
      ? (representedPartyName ?? clean(input.sellerName))
      : clean(input.sellerName);

  if (buyerName) {
    const buyerRepresentative =
      clean(input.sourceIntake?.buyerRepresentativeName) ??
      (
        representedPartyType === "BUYER"
          ? clean(input.sourceIntake?.submitterName)
          : null
      );

    const buyerCountry =
      clean(
        input.sourceIntake?.buyerCountryOfIncorporation,
      ) ??
      (
        representedPartyType === "BUYER"
          ? clean(input.sourceIntake?.submitterCountry)
          : null
      );

    const authoritySummary = input.sourceIntake
      ? [
          input.sourceIntake.authorityToRepresent
            ? "represent"
            : null,
          input.sourceIntake.authorityToNegotiate
            ? "negotiate"
            : null,
          input.sourceIntake.authorityToSign
            ? "sign"
            : null,
          clean(input.sourceIntake.authorityOther),
        ]
          .filter(Boolean)
          .join(", ")
      : "";

    const representativeContext = [
      clean(input.sourceIntake?.buyerRepresentativeTitle),
      clean(input.sourceIntake?.buyerRepresentativeEntity),
      clean(
        input.sourceIntake?.buyerRepresentativeRelationship,
      ),
    ]
      .filter(Boolean)
      .join(" | ");

    parties.push({
      role: "BUYER",
      legalName: buyerName,
      representative: buyerRepresentative,
      country: buyerCountry,
      notes: input.sourceIntake
        ? [
            "Seeded from source intake; operator review required.",
            representativeContext
              ? `Representative context: ${representativeContext}.`
              : null,
            authoritySummary
              ? `Declared authority: ${authoritySummary}.`
              : null,
          ]
            .filter(Boolean)
            .join(" ")
        : "Seeded from promoted opportunity buyer field; operator review required.",
    });
  }

  if (sellerName) {
    parties.push({
      role: "SELLER",
      legalName: sellerName,
      representative:
        representedPartyType === "SELLER"
          ? clean(input.sourceIntake?.submitterName)
          : null,
      country:
        representedPartyType === "SELLER"
          ? clean(input.sourceIntake?.submitterCountry)
          : null,
      notes:
        representedPartyType === "SELLER"
          ? `Seeded from source intake. Submitter: ${input.sourceIntake?.submitterName} <${input.sourceIntake?.submitterEmail}>.`
          : "Seeded from promoted opportunity seller field.",
    });
  }

  return parties;
}

export async function promoteOpportunityToDossier({
  opportunityId,
  operatorEmail,
}: Input): Promise<OpportunityPromotionResult> {
  const opportunity = await prisma.opportunity.findUnique({
    where: {
      id: opportunityId,
    },
    include: {
      promotedDossier: true,
    },
  });

  if (!opportunity) {
    throw new Error("OPPORTUNITY_NOT_FOUND");
  }

  if (opportunity.promotedDossierId && opportunity.promotedDossier) {
    return {
      opportunityId: opportunity.id,
      dossierId: opportunity.promotedDossierId,
      reference: opportunity.promotedDossier.reference,
      alreadyPromoted: true,
    };
  }

  if (opportunity.promotedDossierId) {
    const promotedDossier = await prisma.transactionDossier.findUnique({
      where: {
        id: opportunity.promotedDossierId,
      },
    });

    if (promotedDossier) {
      return {
        opportunityId: opportunity.id,
        dossierId: promotedDossier.id,
        reference: promotedDossier.reference,
        alreadyPromoted: true,
      };
    }
  }

  if (opportunity.status !== "APPROVED") {
    throw new Error("OPPORTUNITY_NOT_APPROVED");
  }

  const reference = buildDossierReference();

  const result = await prisma.$transaction(async (tx: PromotionTransaction) => {
    const latestOpportunity = await tx.opportunity.findUnique({
      where: {
        id: opportunity.id,
      },
      include: {
        promotedDossier: true,
        sourceTransactionIntake: {
          select: {
            id: true,
            reference: true,

            submitterName: true,
            submitterEmail: true,
            submitterPhone: true,
            submitterCompany: true,
            submitterCountry: true,
            submitterRole: true,

            representedPartyType: true,
            representedPartyName: true,
            authorizationStatus: true,

            transactionType: true,
            commodity: true,
            origin: true,
            destination: true,
            deliveryTerms: true,
            settlementMethod: true,
            expectedTimeline: true,
            buyerName: true,
            sellerName: true,
            refineryPreference: true,
            financialReadiness: true,
            documentsAvailable: true,

            buyerRegistrationNumber: true,
            buyerCountryOfIncorporation: true,
            buyerRegisteredAddress: true,
            buyerBusinessAddress: true,
            buyerCorporateEmail: true,
            buyerCorporatePhone: true,

            buyerRepresentativeName: true,
            buyerRepresentativeTitle: true,
            buyerRepresentativeEntity: true,
            buyerRepresentativeEmail: true,
            buyerRepresentativePhone: true,
            buyerRepresentativeRelationship: true,

            authorityToRepresent: true,
            authorityToNegotiate: true,
            authorityToSign: true,
            authorityOther: true,
            externalParticipants: true,

            requestedPurity: true,
            transactionPurpose: true,
            transactionWindow: true,
            continuingSupplyIntent: true,
            recurringQuantity: true,
            recurringFrequency: true,
            desiredTerm: true,
            destinationStatus: true,
            buyerRequirements: true,

            deliveryPathway: true,
            deliveryPoint: true,
            buyerRepresentativesPresent: true,
            buyerRepresentative1: true,
            buyerRepresentative2: true,
            refineryJurisdiction: true,
            assayPosture: true,
            additionalAssayRequirements: true,

            settlementPathway: true,
            settlementRail: true,
            settlementCurrencyAsset: true,
            settlementTimingRequirement: true,
            bankMessageFormat: true,
            digitalAsset: true,
            digitalAssetNetwork: true,
            additionalSettlementAuthorityRequired: true,
            additionalSettlementAuthorityDetail: true,
            financialCapacityStatus: true,

            incorporationRecordAvailable: true,
            kybRecordAvailable: true,
            representativeIdAvailable: true,
            authorityDocumentAvailable: true,
            specialComplianceRequirements: true,
            specialComplianceDetail: true,

            authorizedSubmitterEntity: true,
            authorizedSubmitterRepresentative: true,
            authorizedSubmitterPosition: true,
            authorizedSubmissionDate: true,

            referralCode: true,
            referredByName: true,
            referredByCompany: true,
            referredByEmail: true,
            referredByPhone: true,
            referredByRole: true,
            referralConfirmed: true,
            compensationExpectation: true,
          },
        },
      },
    });

    if (!latestOpportunity) {
      throw new Error("OPPORTUNITY_NOT_FOUND");
    }

    if (
      latestOpportunity.promotedDossierId &&
      latestOpportunity.promotedDossier
    ) {
      return {
        dossier: latestOpportunity.promotedDossier,
        alreadyPromoted: true,
      };
    }

    if (latestOpportunity.status !== "APPROVED") {
      throw new Error("OPPORTUNITY_NOT_APPROVED");
    }

    const quantityKg = normalizeQuantityKg(latestOpportunity.quantityKg);

    const partySeeds = buildPartySeeds({
      buyerName: latestOpportunity.buyerName,
      sellerName: latestOpportunity.sellerName,
      sourceIntake: latestOpportunity.sourceTransactionIntake,
    });

    const termsSeed = latestOpportunity.sourceTransactionIntake
      ? buildTermsSeed({
          settlementMethod:
            latestOpportunity.sourceTransactionIntake.settlementMethod,
          settlementPathway:
            latestOpportunity.sourceTransactionIntake.settlementPathway,
          settlementRail:
            latestOpportunity.sourceTransactionIntake.settlementRail,
          settlementCurrencyAsset:
            latestOpportunity.sourceTransactionIntake
              .settlementCurrencyAsset,
          bankMessageFormat:
            latestOpportunity.sourceTransactionIntake.bankMessageFormat,
          digitalAsset:
            latestOpportunity.sourceTransactionIntake.digitalAsset,
          digitalAssetNetwork:
            latestOpportunity.sourceTransactionIntake.digitalAssetNetwork,
          transactionType:
            latestOpportunity.sourceTransactionIntake.transactionType,
          compensationExpectation:
            latestOpportunity.sourceTransactionIntake.compensationExpectation,
          referralCode:
            latestOpportunity.sourceTransactionIntake.referralCode,
          referredByName:
            latestOpportunity.sourceTransactionIntake.referredByName,
          referredByCompany:
            latestOpportunity.sourceTransactionIntake.referredByCompany,
        })
      : null;

    const settlementSeed =
      latestOpportunity.sourceTransactionIntake
        ? buildSettlementDescriptor(
            latestOpportunity.sourceTransactionIntake,
          )
        : null;

    const refinerySeed =
      latestOpportunity.sourceTransactionIntake
        ? buildRefineryDescriptor(
            latestOpportunity.sourceTransactionIntake,
          )
        : null;

    const dossier = await tx.transactionDossier.create({
      data: {
        reference,
        title: latestOpportunity.title,
        state: "INTAKE_PENDING",
        commodity: latestOpportunity.commodity,
        origin: latestOpportunity.origin,
        quantityKg,
        settlement: settlementSeed,
        refinery: refinerySeed,
        terms: termsSeed
          ? {
              create: termsSeed,
            }
          : undefined,
        parties:
          partySeeds.length > 0
            ? {
                create: partySeeds,
              }
            : undefined,
      },
    });

    await tx.opportunity.update({
      where: {
        id: latestOpportunity.id,
      },
      data: {
        status: "PROMOTED",
        promotedDossierId: dossier.id,
        dossierId: dossier.id,
      },
    });

    await tx.transactionDossierEvent.create({
      data: {
        dossierId: dossier.id,
        eventType: "DOSSIER_CREATED",
        fromState: null,
        toState: "INTAKE_PENDING",
        message: "Dossier created from promoted opportunity.",
        actor: operatorEmail,
        metadata: {
          source: "opportunity.promotion",
          opportunityId: latestOpportunity.id,
          opportunityTitle: latestOpportunity.title,
          seededPartyCount: partySeeds.length,
          seededTerms: termsSeed
            ? Object.entries(termsSeed)
                .filter(([, value]) => value !== null)
                .map(([key]) => key)
            : [],
          sourceIntakeId: latestOpportunity.sourceTransactionIntake?.id ?? null,
          sourceIntakeReference:
            latestOpportunity.sourceTransactionIntake?.reference ?? null,
          referralCode:
            latestOpportunity.sourceTransactionIntake?.referralCode ?? null,
          referredByName:
            latestOpportunity.sourceTransactionIntake?.referredByName ?? null,
        },
      },
    });

    if (latestOpportunity.sourceTransactionIntake) {
      const source =
        latestOpportunity.sourceTransactionIntake;

      await tx.transactionDossierEvent.create({
        data: {
          dossierId: dossier.id,
          eventType:
            "DOSSIER_SOURCE_CONTEXT_CAPTURED",
          fromState: null,
          toState: "INTAKE_PENDING",
          message:
            "Source intake context captured at dossier creation; seeded values remain subject to operator review.",
          actor: operatorEmail,
          metadata: {
            source: "transaction-intake.v4",
            sourceIntakeId: source.id,
            sourceIntakeReference:
              source.reference,

            counterpartyIdentity: {
              buyerName: source.buyerName,
              buyerRegistrationNumber:
                source.buyerRegistrationNumber,
              buyerCountryOfIncorporation:
                source.buyerCountryOfIncorporation,
              buyerRegisteredAddress:
                source.buyerRegisteredAddress,
              buyerBusinessAddress:
                source.buyerBusinessAddress,
              buyerCorporateEmail:
                source.buyerCorporateEmail,
              buyerCorporatePhone:
                source.buyerCorporatePhone,
            },

            representativeAuthority: {
              buyerRepresentativeName:
                source.buyerRepresentativeName,
              buyerRepresentativeTitle:
                source.buyerRepresentativeTitle,
              buyerRepresentativeEntity:
                source.buyerRepresentativeEntity,
              buyerRepresentativeRelationship:
                source.buyerRepresentativeRelationship,
              authorityToRepresent:
                source.authorityToRepresent,
              authorityToNegotiate:
                source.authorityToNegotiate,
              authorityToSign:
                source.authorityToSign,
              authorityOther:
                source.authorityOther,
            },

            transactionProfile: {
              transactionType:
                source.transactionType,
              requestedPurity:
                source.requestedPurity,
              transactionPurpose:
                source.transactionPurpose,
              transactionWindow:
                source.transactionWindow,
              continuingSupplyIntent:
                source.continuingSupplyIntent,
              recurringQuantity:
                source.recurringQuantity,
              recurringFrequency:
                source.recurringFrequency,
              desiredTerm:
                source.desiredTerm,
              destinationStatus:
                source.destinationStatus,
              buyerRequirements:
                source.buyerRequirements,
            },

            passage: {
              origin: source.origin,
              destination: source.destination,
              deliveryPathway:
                source.deliveryPathway,
              deliveryPoint:
                source.deliveryPoint,
              buyerRepresentativesPresent:
                source.buyerRepresentativesPresent,
              refineryJurisdiction:
                source.refineryJurisdiction,
              assayPosture:
                source.assayPosture,
              additionalAssayRequirements:
                source.additionalAssayRequirements,
            },

            settlement: {
              legacySettlementMethod:
                source.settlementMethod,
              settlementPathway:
                source.settlementPathway,
              settlementRail:
                source.settlementRail,
              settlementCurrencyAsset:
                source.settlementCurrencyAsset,
              settlementTimingRequirement:
                source.settlementTimingRequirement,
              bankMessageFormat:
                source.bankMessageFormat,
              digitalAsset:
                source.digitalAsset,
              digitalAssetNetwork:
                source.digitalAssetNetwork,
              additionalSettlementAuthorityRequired:
                source.additionalSettlementAuthorityRequired,
              additionalSettlementAuthorityDetail:
                source.additionalSettlementAuthorityDetail,
              financialCapacityStatus:
                source.financialCapacityStatus,
            },

            documentaryReadiness: {
              incorporationRecordAvailable:
                source.incorporationRecordAvailable,
              kybRecordAvailable:
                source.kybRecordAvailable,
              representativeIdAvailable:
                source.representativeIdAvailable,
              authorityDocumentAvailable:
                source.authorityDocumentAvailable,
              specialComplianceRequirements:
                source.specialComplianceRequirements,
              specialComplianceDetail:
                source.specialComplianceDetail,
            },

            authorizedSubmission: {
              entity:
                source.authorizedSubmitterEntity,
              representative:
                source.authorizedSubmitterRepresentative,
              position:
                source.authorizedSubmitterPosition,
              submissionDate:
                source.authorizedSubmissionDate,
            },

            derivation: {
              dossierSettlement:
                settlementSeed,
              dossierRefinery:
                refinerySeed,
              seededPartyCount:
                partySeeds.length,
              seededTerms: termsSeed
                ? Object.entries(termsSeed)
                    .filter(
                      ([, value]) =>
                        value !== null,
                    )
                    .map(([key]) => key)
                : [],
            },

            doctrine: {
              declaredIsNotVerified: true,
              seededIsNotConfirmed: true,
            },
          },
        },
      });
    }

    if (partySeeds.length > 0) {
      await tx.transactionDossierEvent.create({
        data: {
          dossierId: dossier.id,
          eventType: "DOSSIER_PARTIES_SEEDED",
          fromState: null,
          toState: "INTAKE_PENDING",
          message: "Initial dossier parties seeded from promoted opportunity.",
          actor: operatorEmail,
          metadata: {
            source: "opportunity.promotion",
            opportunityId: latestOpportunity.id,
            seededParties: partySeeds.map((party) => ({
              role: party.role,
              legalName: party.legalName,
            })),
          },
        },
      });
    }

    if (termsSeed) {
      await tx.transactionDossierEvent.create({
        data: {
          dossierId: dossier.id,
          eventType: "DOSSIER_TERMS_SEEDED",
          fromState: null,
          toState: "INTAKE_PENDING",
          message: "Initial structured terms seeded from source intake.",
          actor: operatorEmail,
          metadata: {
            source: "opportunity.promotion",
            opportunityId: latestOpportunity.id,
            seededTerms: Object.entries(termsSeed)
              .filter(([, value]) => value !== null)
              .map(([key]) => key),
          },
        },
      });
    }

    return {
      dossier,
      alreadyPromoted: false,
    };
  });

  if (!result.alreadyPromoted) {
    await createOpportunityEvent({
      opportunityId: opportunity.id,
      type: "OPPORTUNITY_PROMOTED",
      actor: operatorEmail,
      message: "Opportunity promoted into transaction dossier.",
      metadata: {
        source: "opportunity.promotion",
        dossierId: result.dossier.id,
        reference: result.dossier.reference,
      },
    });
  }

  return {
    opportunityId: opportunity.id,
    dossierId: result.dossier.id,
    reference: result.dossier.reference,
    alreadyPromoted: result.alreadyPromoted,
  };
}
