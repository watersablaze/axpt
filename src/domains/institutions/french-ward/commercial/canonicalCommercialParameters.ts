import {
  FRENCH_WARD_COMMERCIAL_PARAMETERS_STATUS,
  FRENCH_WARD_COMMERCIAL_PARAMETER_STATE,
  assertFrenchWardCommercialParameters,
  type FrenchWardCommercialParameters,
} from "./contracts";

/**
 * Canonical French-Ward representative commercial-parameter source.
 *
 * V1 establishes the architecture without inventing general commercial
 * terms that have not yet been approved as institution-wide guidance.
 *
 * Transaction-specific terms remain governed by their transaction
 * dossier, Commercial Profile / Schedule, SPA, DSI, or other applicable
 * transaction record.
 *
 * Source-specific assertions remain governed by Source Authority.
 */
export const FRENCH_WARD_COMMERCIAL_PARAMETERS:
  FrenchWardCommercialParameters = {
    reference:
      "FW-COMM-PARAM-2026-001",

    version:
      1,

    status:
      FRENCH_WARD_COMMERCIAL_PARAMETERS_STATUS
        .PREPARING,

    issuer:
      "French-Ward, Inc.",

    scope:
      "Representative Commercial Guidance",

    commodity: {
      state:
        FRENCH_WARD_COMMERCIAL_PARAMETER_STATE
          .UNRESOLVED,

      value:
        null,

      note:
        "Commodity guidance has not yet been released as institution-wide representative parameters.",
    },

    transactionStructure: {
      state:
        FRENCH_WARD_COMMERCIAL_PARAMETER_STATE
          .UNRESOLVED,

      value:
        null,

      note:
        "Transaction structure remains subject to French-Ward commercial review and applicable governing instruments.",
    },

    quantityFramework: {
      state:
        FRENCH_WARD_COMMERCIAL_PARAMETER_STATE
          .UNRESOLVED,

      value:
        null,

      note:
        "No representative-wide quantity framework has yet been released.",
    },

    pricingFramework: {
      state:
        FRENCH_WARD_COMMERCIAL_PARAMETER_STATE
          .UNRESOLVED,

      value:
        null,

      note:
        "No representative-wide pricing framework has yet been released.",
    },

    deliveryFramework: {
      state:
        FRENCH_WARD_COMMERCIAL_PARAMETER_STATE
          .UNRESOLVED,

      value:
        null,

      note:
        "Delivery terms remain transaction-specific until French-Ward releases general representative guidance.",
    },

    settlementFramework: {
      state:
        FRENCH_WARD_COMMERCIAL_PARAMETER_STATE
          .UNRESOLVED,

      value:
        null,

      note:
        "Settlement terms remain transaction-specific until French-Ward releases general representative guidance.",
    },

    effectiveFrom:
      null,

    effectiveThrough:
      null,
  };

assertFrenchWardCommercialParameters(
  FRENCH_WARD_COMMERCIAL_PARAMETERS,
);
