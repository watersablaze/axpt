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

// ============================================================================
// CUP RELEASE GOVERNANCE
// ============================================================================

export type CommercialUtilityPackModuleState =
  (typeof COMMERCIAL_UTILITY_PACK_MODULE_STATE)[keyof typeof COMMERCIAL_UTILITY_PACK_MODULE_STATE];

export type CommercialUtilityPackReleaseState =
  (typeof COMMERCIAL_UTILITY_PACK_RELEASE_STATE)[keyof typeof COMMERCIAL_UTILITY_PACK_RELEASE_STATE];

export const COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE = {
  INSTITUTIONAL_INSTRUMENT: "INSTITUTIONAL_INSTRUMENT",
  DOCUMENT: "DOCUMENT",
  STRUCTURED_CONTENT: "STRUCTURED_CONTENT",
} as const;

export type CommercialUtilityPackResourceType =
  (typeof COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE)[keyof typeof COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE];

export const COMMERCIAL_UTILITY_PACK_RESOURCE_STATE = {
  WITHHELD: "WITHHELD",
  RELEASED: "RELEASED",
  SUPERSEDED: "SUPERSEDED",
  WITHDRAWN: "WITHDRAWN",
} as const;

export type CommercialUtilityPackResourceState =
  (typeof COMMERCIAL_UTILITY_PACK_RESOURCE_STATE)[keyof typeof COMMERCIAL_UTILITY_PACK_RESOURCE_STATE];

export const COMMERCIAL_UTILITY_PACK_EVENT_TYPE_RELEASE = {
  MODULE_STATE_CHANGED:
    "COMMERCIAL_UTILITY_PACK_MODULE_STATE_CHANGED",

  RESOURCE_RELEASED:
    "COMMERCIAL_UTILITY_PACK_RESOURCE_RELEASED",

  RESOURCE_SUPERSEDED:
    "COMMERCIAL_UTILITY_PACK_RESOURCE_SUPERSEDED",

  RESOURCE_WITHDRAWN:
    "COMMERCIAL_UTILITY_PACK_RESOURCE_WITHDRAWN",

  RELEASE_STATE_CHANGED:
    "COMMERCIAL_UTILITY_PACK_RELEASE_STATE_CHANGED",

  RELEASED:
    "COMMERCIAL_UTILITY_PACK_RELEASED",
} as const;

const COMMERCIAL_UTILITY_PACK_MODULE_TRANSITIONS:
  Readonly<
    Record<
      CommercialUtilityPackModuleState,
      readonly CommercialUtilityPackModuleState[]
    >
  > = {
    WITHHELD: [
      COMMERCIAL_UTILITY_PACK_MODULE_STATE.READY,
    ],

    READY: [
      COMMERCIAL_UTILITY_PACK_MODULE_STATE.RELEASED,
    ],

    RELEASED: [],
  };

const COMMERCIAL_UTILITY_PACK_RESOURCE_TRANSITIONS:
  Readonly<
    Record<
      CommercialUtilityPackResourceState,
      readonly CommercialUtilityPackResourceState[]
    >
  > = {
    WITHHELD: [
      COMMERCIAL_UTILITY_PACK_RESOURCE_STATE.RELEASED,
    ],

    RELEASED: [
      COMMERCIAL_UTILITY_PACK_RESOURCE_STATE.SUPERSEDED,
      COMMERCIAL_UTILITY_PACK_RESOURCE_STATE.WITHDRAWN,
    ],

    SUPERSEDED: [],

    WITHDRAWN: [],
  };

export function canTransitionCommercialUtilityPackModule(
  from: CommercialUtilityPackModuleState,
  to: CommercialUtilityPackModuleState,
): boolean {
  if (from === to) {
    return true;
  }

  return COMMERCIAL_UTILITY_PACK_MODULE_TRANSITIONS[
    from
  ].includes(to);
}

export function assertCommercialUtilityPackModuleTransition(
  params: {
    from: CommercialUtilityPackModuleState;
    to: CommercialUtilityPackModuleState;
  },
): void {
  if (
    !canTransitionCommercialUtilityPackModule(
      params.from,
      params.to,
    )
  ) {
    throw new Error(
      `[CUP_MODULE_TRANSITION_INVALID] ${params.from}->${params.to}`,
    );
  }
}

export function canTransitionCommercialUtilityPackResource(
  from: CommercialUtilityPackResourceState,
  to: CommercialUtilityPackResourceState,
): boolean {
  if (from === to) {
    return true;
  }

  return COMMERCIAL_UTILITY_PACK_RESOURCE_TRANSITIONS[
    from
  ].includes(to);
}

export function assertCommercialUtilityPackResourceTransition(
  params: {
    from: CommercialUtilityPackResourceState;
    to: CommercialUtilityPackResourceState;
  },
): void {
  if (
    !canTransitionCommercialUtilityPackResource(
      params.from,
      params.to,
    )
  ) {
    throw new Error(
      `[CUP_RESOURCE_TRANSITION_INVALID] ${params.from}->${params.to}`,
    );
  }
}

export function deriveCommercialUtilityPackReleaseState(
  moduleStates:
    readonly CommercialUtilityPackModuleState[],
): CommercialUtilityPackReleaseState {
  if (
    moduleStates.length !==
    COMMERCIAL_UTILITY_PACK_MODULES.length
  ) {
    throw new Error(
      "[CUP_RELEASE_STATE_MODULE_CARDINALITY_INVALID]",
    );
  }

  if (
    moduleStates.every(
      (state) =>
        state ===
        COMMERCIAL_UTILITY_PACK_MODULE_STATE.WITHHELD,
    )
  ) {
    return COMMERCIAL_UTILITY_PACK_RELEASE_STATE
      .WITHHELD;
  }

  if (
    moduleStates.every(
      (state) =>
        state ===
        COMMERCIAL_UTILITY_PACK_MODULE_STATE.RELEASED,
    )
  ) {
    return COMMERCIAL_UTILITY_PACK_RELEASE_STATE
      .RELEASED;
  }

  return COMMERCIAL_UTILITY_PACK_RELEASE_STATE
    .PARTIAL;
}
