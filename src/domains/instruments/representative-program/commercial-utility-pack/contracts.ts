export const COMMERCIAL_UTILITY_PACK_MODULE = {
  REPRESENTATION: "REPRESENTATION",
  COMMERCIAL_PARAMETERS: "COMMERCIAL_PARAMETERS",
  DOCUMENTS: "DOCUMENTS",
  OPERATING_BOUNDARIES: "OPERATING_BOUNDARIES",
} as const;

export type CommercialUtilityPackModule =
  (typeof COMMERCIAL_UTILITY_PACK_MODULE)[keyof typeof COMMERCIAL_UTILITY_PACK_MODULE];

export const COMMERCIAL_UTILITY_PACK_MODULES =
  Object.freeze([
    COMMERCIAL_UTILITY_PACK_MODULE.REPRESENTATION,
    COMMERCIAL_UTILITY_PACK_MODULE.COMMERCIAL_PARAMETERS,
    COMMERCIAL_UTILITY_PACK_MODULE.DOCUMENTS,
    COMMERCIAL_UTILITY_PACK_MODULE.OPERATING_BOUNDARIES,
  ] as const);

export const COMMERCIAL_UTILITY_PACK_STATE = {
  PREPARING: "PREPARING",
  CURRENT: "CURRENT",
  SUPERSEDED: "SUPERSEDED",
  WITHDRAWN: "WITHDRAWN",
} as const;

export const COMMERCIAL_UTILITY_PACK_RELEASE_STATE = {
  WITHHELD: "WITHHELD",
  PARTIAL: "PARTIAL",
  RELEASED: "RELEASED",
} as const;

export const COMMERCIAL_UTILITY_PACK_MODULE_STATE = {
  WITHHELD: "WITHHELD",
  READY: "READY",
  RELEASED: "RELEASED",
} as const;

export const COMMERCIAL_UTILITY_PACK_AUDIENCE = {
  REPRESENTATIVE: "REPRESENTATIVE",
} as const;

export const COMMERCIAL_UTILITY_PACK_STREAM_TYPE =
  "COMMERCIAL_UTILITY_PACK";

export const COMMERCIAL_UTILITY_PACK_EVENT_TYPE = {
  CREATED:
    "COMMERCIAL_UTILITY_PACK_CREATED",
} as const;

export function createCommercialUtilityPackReference(params: {
  docketReference: string;
  version: number;
}): string {
  const docketReference =
    params.docketReference.trim();

  if (
    !docketReference ||
    !Number.isInteger(params.version) ||
    params.version < 1 ||
    params.version > 999
  ) {
    throw new Error(
      "[CUP_REFERENCE_INPUT_INVALID]",
    );
  }

  return (
    `${docketReference}-CUP-` +
    String(params.version).padStart(3, "0")
  );
}
