export const FRENCH_WARD_COMMERCIAL_PARAMETERS_STATUS = {
  PREPARING:
    "PREPARING",

  CURRENT:
    "CURRENT",

  SUPERSEDED:
    "SUPERSEDED",

  WITHDRAWN:
    "WITHDRAWN",
} as const;

export type FrenchWardCommercialParametersStatus =
  (typeof FRENCH_WARD_COMMERCIAL_PARAMETERS_STATUS)[keyof typeof FRENCH_WARD_COMMERCIAL_PARAMETERS_STATUS];

export const FRENCH_WARD_COMMERCIAL_PARAMETER_STATE = {
  UNRESOLVED:
    "UNRESOLVED",

  DEFINED:
    "DEFINED",
} as const;

export type FrenchWardCommercialParameterState =
  (typeof FRENCH_WARD_COMMERCIAL_PARAMETER_STATE)[keyof typeof FRENCH_WARD_COMMERCIAL_PARAMETER_STATE];

export type FrenchWardCommercialParameter =
  Readonly<{
    state:
      FrenchWardCommercialParameterState;

    value:
      string | null;

    note:
      string | null;
  }>;

export type FrenchWardCommercialParameters =
  Readonly<{
    reference:
      string;

    version:
      number;

    status:
      FrenchWardCommercialParametersStatus;

    issuer:
      string;

    scope:
      string;

    commodity:
      FrenchWardCommercialParameter;

    transactionStructure:
      FrenchWardCommercialParameter;

    quantityFramework:
      FrenchWardCommercialParameter;

    pricingFramework:
      FrenchWardCommercialParameter;

    deliveryFramework:
      FrenchWardCommercialParameter;

    settlementFramework:
      FrenchWardCommercialParameter;

    effectiveFrom:
      string | null;

    effectiveThrough:
      string | null;
  }>;

export type FrenchWardCommercialParametersProjection =
  FrenchWardCommercialParameters;

export function assertFrenchWardCommercialParameters(
  parameters:
    FrenchWardCommercialParameters,
): void {
  if (
    !parameters.reference.trim() ||
    parameters.version < 1 ||
    !parameters.issuer.trim() ||
    !parameters.scope.trim()
  ) {
    throw new Error(
      "[FRENCH_WARD_COMMERCIAL_PARAMETERS_IDENTITY_REQUIRED]",
    );
  }

  const entries = [
    parameters.commodity,
    parameters.transactionStructure,
    parameters.quantityFramework,
    parameters.pricingFramework,
    parameters.deliveryFramework,
    parameters.settlementFramework,
  ];

  for (const entry of entries) {
    if (
      entry.state ===
        FRENCH_WARD_COMMERCIAL_PARAMETER_STATE
          .DEFINED &&
      !entry.value?.trim()
    ) {
      throw new Error(
        "[FRENCH_WARD_COMMERCIAL_PARAMETER_DEFINED_VALUE_REQUIRED]",
      );
    }

    if (
      entry.state ===
        FRENCH_WARD_COMMERCIAL_PARAMETER_STATE
          .UNRESOLVED &&
      entry.value !== null
    ) {
      throw new Error(
        "[FRENCH_WARD_COMMERCIAL_PARAMETER_UNRESOLVED_VALUE_PROHIBITED]",
      );
    }
  }

  if (
    parameters.status ===
      FRENCH_WARD_COMMERCIAL_PARAMETERS_STATUS
        .CURRENT &&
    entries.some(
      (entry) =>
        entry.state !==
          FRENCH_WARD_COMMERCIAL_PARAMETER_STATE
            .DEFINED,
    )
  ) {
    throw new Error(
      "[FRENCH_WARD_COMMERCIAL_PARAMETERS_CURRENT_REQUIRES_DEFINED_FIELDS]",
    );
  }
}
