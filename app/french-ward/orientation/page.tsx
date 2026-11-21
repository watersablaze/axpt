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
  loadCurrentFrenchWardInstitutionalParticipantWithClient,
} from "@/domains/institutions/french-ward/participants/loadCurrentFrenchWardInstitutionalParticipantWithClient";
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

  const institutionalParticipant =
    await loadCurrentFrenchWardInstitutionalParticipantWithClient({
      client: prisma,
      userId: principal.userId,
    });

  const admission =
    resolveFrenchWardOrientationAdmission({
      admin:
        isAdmin(principal),
      governingStanding,
      institutionalParticipant,
    });

  if (!admission.admitted) {
    redirect("/french-ward");
  }

  const completed =
    await prisma.frenchWardOrientationCompletion.findUnique({
      where: {
        userId_orientationVersion: {
          userId: principal.userId,
          orientationVersion: "FW-ORIENTATION-V1",
        },
      },
      select: { id: true },
    });

  if (completed) {
    redirect("/french-ward/home");
  }

  return (
    <OrientationSequence
      participant={{
        name:
          governingStanding?.active
            ? governingStanding.displayName
            : institutionalParticipant?.active
              ? institutionalParticipant.displayName
              : principal.displayName ??
                "Authenticated participant",
        institutionalTitle:
          governingStanding?.active
            ? governingStanding.institutionalTitle
            : institutionalParticipant?.active
              ? institutionalParticipant.institutionalTitle
              : "Platform Administration",
        secondaryTitle:
          governingStanding?.active
            ? governingStanding.secondaryTitle
            : institutionalParticipant?.active
              ? institutionalParticipant.secondaryTitle
              : null,
        reference:
          governingStanding?.active
            ? governingStanding.reference
            : institutionalParticipant?.active
              ? institutionalParticipant.reference
              : null,
        kind:
          governingStanding?.active
            ? "GOVERNING"
            : institutionalParticipant?.active
              ? "INSTITUTIONAL"
              : "ADMINISTRATIVE_REVIEW",
        capacityClass:
          institutionalParticipant?.active
            ? institutionalParticipant.capacityClass
            : null,
      }}
    />
  );
}
