import {
  FRENCH_WARD_COMMERCIAL_INTAKE_STATUS,
  assertFrenchWardCommercialIntake,
  type FrenchWardCommercialIntake,
} from "./commercialIntakeContracts";

/**
 * Canonical French-Ward controlled commercial-intake entry point.
 *
 * This source establishes the institutional identity of the pathway only.
 *
 * It does not:
 * - grant access to the intake;
 * - authorize a transaction submission;
 * - accept a proposed transaction;
 * - create buyer or seller authority;
 * - establish representative authority.
 *
 * Recipient-specific access remains governed separately by the
 * Institutional Access framework under LOI_INTAKE_ACCESS.
 */
export const FRENCH_WARD_COMMERCIAL_INTAKE:
  FrenchWardCommercialIntake = {
    reference:
      "french-ward:commercial-intake:v1",

    version:
      1,

    status:
      FRENCH_WARD_COMMERCIAL_INTAKE_STATUS
        .CURRENT,

    issuer:
      "French-Ward, Inc.",

    label:
      "French-Ward Commercial Intake",

    route:
      "/french-ward/transaction-intake",

    accessScope:
      "LOI_INTAKE_ACCESS",

    posture:
      "CONTROLLED_INTAKE_ENTRY_POINT",
  };

assertFrenchWardCommercialIntake(
  FRENCH_WARD_COMMERCIAL_INTAKE,
);
