import type {
  RepresentativeAuthorityKey,
} from "../contracts";

export const REPRESENTATIVE_OPERATING_BOUNDARIES_STATUS = {
  CURRENT:
    "CURRENT",

  SUPERSEDED:
    "SUPERSEDED",

  WITHDRAWN:
    "WITHDRAWN",
} as const;

export type RepresentativeOperatingBoundariesStatus =
  (typeof REPRESENTATIVE_OPERATING_BOUNDARIES_STATUS)[keyof typeof REPRESENTATIVE_OPERATING_BOUNDARIES_STATUS];

export const REPRESENTATIVE_OPERATING_BOUNDARY_REQUIREMENT = {
  RECORDED_AUTHORITY:
    "RECORDED_AUTHORITY",

  RECORDED_AUTHORITY_AND_APPROVAL:
    "RECORDED_AUTHORITY_AND_APPROVAL",

  WRITTEN_AUTHORIZATION:
    "WRITTEN_AUTHORIZATION",

  AUTHORIZED_PURPOSE_ONLY:
    "AUTHORIZED_PURPOSE_ONLY",
} as const;

export type RepresentativeOperatingBoundaryRequirement =
  (typeof REPRESENTATIVE_OPERATING_BOUNDARY_REQUIREMENT)[keyof typeof REPRESENTATIVE_OPERATING_BOUNDARY_REQUIREMENT];

export type RepresentativeOperatingBoundary =
  Readonly<{
    key:
      string;

    title:
      string;

    statement:
      string;

    authorityKey:
      RepresentativeAuthorityKey | null;

    requirement:
      RepresentativeOperatingBoundaryRequirement;

    representativeInstruction:
      string;
  }>;

export type RepresentativeOperatingBoundaries =
  Readonly<{
    reference:
      string;

    version:
      number;

    status:
      RepresentativeOperatingBoundariesStatus;

    title:
      string;

    scope:
      string;

    authorityStatement:
      string;

    boundaries:
      readonly RepresentativeOperatingBoundary[];
  }>;

export type RepresentativeOperatingBoundariesProjection =
  RepresentativeOperatingBoundaries;

export function assertRepresentativeOperatingBoundaries(
  policy:
    RepresentativeOperatingBoundaries,
): void {
  if (
    !policy.reference.trim() ||
    policy.version < 1 ||
    !policy.title.trim() ||
    !policy.scope.trim() ||
    !policy.authorityStatement.trim() ||
    policy.boundaries.length === 0
  ) {
    throw new Error(
      "[ARP_OPERATING_BOUNDARIES_IDENTITY_REQUIRED]",
    );
  }

  const keys = new Set<string>();

  for (const boundary of policy.boundaries) {
    if (
      !boundary.key.trim() ||
      !boundary.title.trim() ||
      !boundary.statement.trim() ||
      !boundary.representativeInstruction.trim()
    ) {
      throw new Error(
        "[ARP_OPERATING_BOUNDARY_CONTENT_REQUIRED]",
      );
    }

    if (keys.has(boundary.key)) {
      throw new Error(
        `[ARP_OPERATING_BOUNDARY_DUPLICATE] ${boundary.key}`,
      );
    }

    keys.add(boundary.key);

    if (
      (
        boundary.requirement ===
          REPRESENTATIVE_OPERATING_BOUNDARY_REQUIREMENT
            .RECORDED_AUTHORITY ||
        boundary.requirement ===
          REPRESENTATIVE_OPERATING_BOUNDARY_REQUIREMENT
            .RECORDED_AUTHORITY_AND_APPROVAL
      ) &&
      boundary.authorityKey === null
    ) {
      throw new Error(
        `[ARP_OPERATING_BOUNDARY_AUTHORITY_KEY_REQUIRED] ${boundary.key}`,
      );
    }
  }
}
