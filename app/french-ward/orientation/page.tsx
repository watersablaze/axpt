import type {
  Metadata,
} from "next";
import {
  redirect,
} from "next/navigation";

import {
  getPrincipal,
} from "@/domains/auth/getPrincipal";
import {
  isAdmin,
} from "@/domains/auth/isAdmin";
import {
  loadCurrentFrenchWardGoverningStandingWithClient,
} from "@/domains/institutions/french-ward/governance/loadCurrentFrenchWardGoverningStandingWithClient";
import {
  resolveFrenchWardOrientationAdmission,
} from "@/domains/institutions/french-ward/governance/resolveFrenchWardOrientationAdmission";
import {
  prisma,
} from "@/infrastructure/db/prisma";

import {
  OrientationSequence,
} from "./OrientationSequence";

export const metadata: Metadata = {
  title:
    "French-Ward Orientation | AXPT",
  description:
    "Private French-Ward institutional orientation.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function FrenchWardOrientationPage() {
  const principal =
    await getPrincipal();

  if (!principal) {
    redirect(
      "/login?next=%2Ffrench-ward%2Forientation",
    );
  }

  const governingStanding =
    await loadCurrentFrenchWardGoverningStandingWithClient({
      client: prisma,
      userId: principal.userId,
    });

  const admission =
    resolveFrenchWardOrientationAdmission({
      admin:
        isAdmin(principal),
      governingStanding,
    });

  if (!admission.admitted) {
    redirect("/french-ward");
  }

  return (
    <OrientationSequence
      participant={{
        name:
          governingStanding?.active
            ? governingStanding.displayName
            : principal.displayName ??
              "Authenticated participant",
        institutionalTitle:
          governingStanding?.active
            ? governingStanding.institutionalTitle
            : "Platform Administration",
        secondaryTitle:
          governingStanding?.active
            ? governingStanding.secondaryTitle
            : null,
        reference:
          governingStanding?.active
            ? governingStanding.reference
            : null,
        governing:
          Boolean(
            governingStanding?.active,
          ),
      }}
    />
  );
}
