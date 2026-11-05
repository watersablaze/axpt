import {
  projectFrenchWardInstitutionalProfile,
} from "@/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile";

import {
  TOV_PUBLICATION,
} from "@/domains/institutions/french-ward/tovPublication";

import type {
  FrenchWardHomeDocument,
} from "./contracts";

/**
 * French-Ward Home documentary projection V1.
 *
 * This projection identifies canonical institutional publications
 * made available by the governing-officer Home surface.
 *
 * It does not:
 * - confer governing standing;
 * - confer commercial or instrument authority;
 * - consume Representative CUP permissions;
 * - grant download, presentation or transmission;
 * - expose Representative participant resources.
 *
 * Reader routes independently re-check current governing standing.
 */
export function projectFrenchWardHomeDocuments():
  FrenchWardHomeDocument[] {
  const profile =
    projectFrenchWardInstitutionalProfile();

  return [
    {
      kind: "INSTITUTIONAL_PROFILE",
      reference: profile.reference,
      version: profile.version,
      title:
        "French-Ward Institutional Profile",
      access: "VIEW",
      href:
        "/french-ward/home/documents/profile",
    },
    {
      kind: "TRANSACTION_OVERVIEW",
      reference: TOV_PUBLICATION.reference,
      version: TOV_PUBLICATION.version,
      title:
        "Transaction Overview",
      access: "VIEW",
      href:
        "/french-ward/home/documents/tov",
    },
  ];
}
