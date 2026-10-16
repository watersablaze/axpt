import { z } from "zod";

const optionalShortText = z.string().trim().max(320).optional();
const optionalLongText = z.string().trim().max(4000).optional();
const requiredLongText = z.string().trim().min(1).max(4000);

const stringList = z.array(z.string().trim().min(1).max(240)).max(40);

export const representativeCandidateSubmissionSchema = z
  .object({
    identity: z
      .object({
        fullLegalName: z.string().trim().min(1).max(240),
        preferredProfessionalName: optionalShortText,
        nationality: optionalShortText,
        countryOfResidence: optionalShortText,
        primaryAddress: z.string().trim().max(1000).optional(),
        email: z.string().trim().email().max(320),
        telephone: optionalShortText,
        whatsapp: optionalShortText,
        passportOrIdReference: optionalShortText,
      })
      .strict(),

    professionalProfile: z
      .object({
        currentOccupationOrRole: optionalShortText,
        companyOrOrganizationAffiliations: stringList,
        relevantMarketsOrIndustries: stringList,
        primaryTerritories: stringList,
        languages: stringList,
        commercialCapabilities: stringList,
      })
      .strict(),

    representationContext: z
      .object({
        introductionContext: optionalLongText,
        expectedContribution: optionalLongText,
        relevantRelationshipsOrNetworks: optionalLongText,
        anticipatedRepresentationAreas: stringList,
      })
      .strict(),

    disclosures: z
      .object({
        existingMandatesOrRepresentativeRelationships: requiredLongText,
        potentialConflicts: requiredLongText,
        regulatedActivities: requiredLongText,
        materialAffiliations: requiredLongText,
      })
      .strict(),

    acknowledgements: z
      .object({
        noImpliedAuthority: z.literal(true),
        noUnauthorizedCommercialTermChanges: z.literal(true),
        noImpersonationOfFrenchWard: z.literal(true),
        noUnauthorizedSubdelegation: z.literal(true),
        confidentialityAcknowledged: z.literal(true),
        writtenAppointmentControlsAuthority: z.literal(true),
        informationAccurateToBestKnowledge: z.literal(true),
      })
      .strict(),
  })
  .strict();

export type RepresentativeCandidateSubmissionInput = z.infer<
  typeof representativeCandidateSubmissionSchema
>;
