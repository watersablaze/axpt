import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import {
  loadCurrentFrenchWardGoverningStandingWithClient,
} from "@/domains/institutions/french-ward/governance/loadCurrentFrenchWardGoverningStandingWithClient";
import {
  resolveFrenchWardOrientationAdmission,
} from "@/domains/institutions/french-ward/governance/resolveFrenchWardOrientationAdmission";
import {
  loadCurrentFrenchWardInstitutionalParticipantWithClient,
} from "@/domains/institutions/french-ward/participants/loadCurrentFrenchWardInstitutionalParticipantWithClient";
import { prisma } from "@/infrastructure/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERSION = "FW-ORIENTATION-V1";

const headers = {
  "Cache-Control": "no-store",
};

export async function POST() {
  try {
    const principal = await getPrincipal();

    if (!principal) {
      return NextResponse.json(
        { ok: false, error: "AUTHENTICATION_REQUIRED" },
        { status: 401, headers },
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

    const admission = resolveFrenchWardOrientationAdmission({
      admin: isAdmin(principal),
      governingStanding,
      institutionalParticipant,
    });

    if (!admission.admitted) {
      return NextResponse.json(
        { ok: false, error: "INSTITUTIONAL_ADMISSION_REQUIRED" },
        { status: 403, headers },
      );
    }

    await prisma.frenchWardOrientationCompletion.upsert({
      where: {
        userId_orientationVersion: {
          userId: principal.userId,
          orientationVersion: VERSION,
        },
      },
      create: {
        userId: principal.userId,
        orientationVersion: VERSION,
      },
      update: {},
    });

    return NextResponse.json(
      {
        ok: true,
        next: "/french-ward/home",
      },
      { status: 200, headers },
    );
  } catch (error) {
    console.error(
      "[fw/orientation/complete] completion unavailable",
      error,
    );

    return NextResponse.json(
      { ok: false, error: "ORIENTATION_COMPLETION_UNAVAILABLE" },
      { status: 503, headers },
    );
  }
}
