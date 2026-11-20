export const FRENCH_WARD_COMMERCIAL_INTAKE_STATUS = {
  CURRENT:
    "CURRENT",
} as const;

export type FrenchWardCommercialIntakeStatus =
  (typeof FRENCH_WARD_COMMERCIAL_INTAKE_STATUS)[keyof typeof FRENCH_WARD_COMMERCIAL_INTAKE_STATUS];

export type FrenchWardCommercialIntake =
  Readonly<{
    reference:
      string;

    version:
      number;

    status:
      FrenchWardCommercialIntakeStatus;

    issuer:
      string;

    label:
      string;

    route:
      string;

    accessScope:
      "LOI_INTAKE_ACCESS";

    posture:
      "CONTROLLED_INTAKE_ENTRY_POINT";
  }>;

export type FrenchWardCommercialIntakeProjection =
  FrenchWardCommercialIntake;

export function assertFrenchWardCommercialIntake(
  intake:
    FrenchWardCommercialIntake,
): void {
  if (
    !intake.reference.trim() ||
    intake.version < 1 ||
    !intake.issuer.trim() ||
    !intake.label.trim() ||
    !intake.route.trim()
  ) {
    throw new Error(
      "[FRENCH_WARD_COMMERCIAL_INTAKE_IDENTITY_REQUIRED]",
    );
  }

  if (
    intake.route !==
      "/french-ward/transaction-intake"
  ) {
    throw new Error(
      "[FRENCH_WARD_COMMERCIAL_INTAKE_ROUTE_INVALID]",
    );
  }

  if (
    intake.accessScope !==
      "LOI_INTAKE_ACCESS"
  ) {
    throw new Error(
      "[FRENCH_WARD_COMMERCIAL_INTAKE_SCOPE_INVALID]",
    );
  }

  if (
    intake.posture !==
      "CONTROLLED_INTAKE_ENTRY_POINT"
  ) {
    throw new Error(
      "[FRENCH_WARD_COMMERCIAL_INTAKE_POSTURE_INVALID]",
    );
  }
}
