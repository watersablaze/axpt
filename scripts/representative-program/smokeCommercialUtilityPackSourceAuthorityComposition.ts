import assert from "node:assert/strict";

import type {
  SourceAuthorityPresentationProjection,
} from "../../src/domains/instruments/source-authority/presentation";

import {
  COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND,
  COMMERCIAL_UTILITY_PACK_MODULE,
  COMMERCIAL_UTILITY_PACK_PROJECTION_KEY,
  COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE,
  adaptRepresentativeSourceAuthorityComposition,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack";

function representativeProjection(): SourceAuthorityPresentationProjection {
  return {
    audience:
      "REPRESENTATIVE",

    identity: {
      sourceAuthorityId:
        "source-authority-1",

      instrumentId:
        "instrument-baf-sai-1",

      instrumentReference:
        "BAF-SAI-2026-001",

      instrumentTitle:
        "COOPÉRATIVE DE BAFOULA — SOURCE AUTHORITY INSTRUMENT",

      versionId:
        "instrument-version-1",

      versionNumber:
        1,

      subject: {
        displayName:
          "Coopérative de Bafoula",

        jurisdiction:
          "Republic of Mali",

        institutionalCapacity:
          "Malian Cooperative · Source Authority",

        operatingBase:
          "Bamako, Republic of Mali",

        sector:
          "Minerals and Natural Resources",

        principalCommodityActivity: [
          "Gold",
          "Gold Doré",
        ],
      },

      profileParticulars: {
        documentReference:
          "BAF-PROFILE-MALI-2026-002",

        documentVersion:
          "v4 · 2026",

        documentStatus:
          "External Reference",

        registrationReference:
          null,

        registrationStanding:
          "PENDING_DOCUMENTARY_COMPLETION",

        registeredAddress:
          null,

        authorizedRepresentativeName:
          null,

        authorizedRepresentativeCapacity:
          null,

        officialContact:
          null,
      },
    },

    standing:
      "LIMITED",

    assertions:
      [],

    evidenceRegister:
      [],

    capabilities:
      [],

    operatorRecord:
      [],

    boundary: {
      sovereignAuthorityEstablished:
        false,

      regulatoryApprovalEstablished:
        false,

      exportAuthorizationEstablished:
        false,

      commodityAvailabilityEstablished:
        false,

      commodityAllocationEstablished:
        false,

      titleEstablished:
        false,

      transactionAuthorityConferred:
        false,

      settlementAuthorityConferred:
        false,

      statement:
        "Presentation boundary.",
    },
  };
}

function main() {
  const projection =
    representativeProjection();

  const descriptor =
    adaptRepresentativeSourceAuthorityComposition(
      projection,
    );

  assert.equal(
    descriptor.module,
    COMMERCIAL_UTILITY_PACK_MODULE
      .DOCUMENTS,
  );

  assert.equal(
    descriptor.resourceType,
    COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE
      .INSTITUTIONAL_INSTRUMENT,
  );

  assert.equal(
    descriptor.sourceKind,
    COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND
      .INSTITUTIONAL_INSTRUMENT,
  );

  assert.equal(
    descriptor.projectionKey,
    COMMERCIAL_UTILITY_PACK_PROJECTION_KEY
      .SOURCE_AUTHORITY_PRESENTATION,
  );

  assert.equal(
    descriptor.sourceId,
    "instrument-baf-sai-1",
  );

  assert.equal(
    descriptor.sourceReference,
    "BAF-SAI-2026-001",
  );

  assert.equal(
    descriptor.label,
    "COOPÉRATIVE DE BAFOULA — SOURCE AUTHORITY INSTRUMENT",
  );

  console.log(
    "✓ REPRESENTATIVE Source Authority projection maps to CUP descriptor",
  );

  assert.equal(
    projection.identity.profileParticulars
      .documentReference,
    "BAF-PROFILE-MALI-2026-002",
  );

  assert.equal(
    descriptor.sourceReference,
    "BAF-SAI-2026-001",
  );

  console.log(
    "✓ CUP identity remains Source Authority instrument, not underlying profile",
  );

  assert.equal(
    projection.boundary
      .transactionAuthorityConferred,
    false,
  );

  assert.equal(
    projection.boundary
      .settlementAuthorityConferred,
    false,
  );

  console.log(
    "✓ adapter does not reinterpret Source Authority authority boundary",
  );

  const recipientProjection = {
    ...projection,
    audience:
      "RECIPIENT",
  } as SourceAuthorityPresentationProjection;

  assert.throws(
    () =>
      adaptRepresentativeSourceAuthorityComposition(
        recipientProjection,
      ),

    /CUP_SOURCE_AUTHORITY_AUDIENCE_INVALID/,
  );

  console.log(
    "✓ RECIPIENT projection rejected at representative CUP boundary",
  );

  const operatorProjection = {
    ...projection,
    audience:
      "OPERATOR",
  } as SourceAuthorityPresentationProjection;

  assert.throws(
    () =>
      adaptRepresentativeSourceAuthorityComposition(
        operatorProjection,
      ),

    /CUP_SOURCE_AUTHORITY_AUDIENCE_INVALID/,
  );

  console.log(
    "✓ OPERATOR projection rejected at representative CUP boundary",
  );

  console.log(
    "CUP_1E_SOURCE_AUTHORITY_COMPOSITION_OK",
  );
}

main();
