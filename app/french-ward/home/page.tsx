import type { Metadata } from "next";
import { redirect } from "next/navigation";

import HomeWorkspaceShell from "./HomeWorkspaceShell";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import {
  loadCurrentFrenchWardGoverningStandingWithClient,
} from "@/domains/institutions/french-ward/governance/loadCurrentFrenchWardGoverningStandingWithClient";
import {
  loadFrenchWardHomeWithClient,
} from "@/domains/institutions/french-ward/home/loadFrenchWardHomeWithClient";
import {
  FRENCH_WARD_ACTION,
  resolveFrenchWardActionAuthorityWithClient,
} from "@/domains/institutions/french-ward/governance/resolveFrenchWardActionAuthorityWithClient";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "French-Ward Home",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function FrenchWardHomePage({
  searchParams,
}: {
  searchParams?: Promise<{
    module?: string;
  }>;
}) {
  const principal = await getPrincipal();

  const resolvedSearchParams =
    await searchParams;

  const initialModule =
    resolvedSearchParams?.module ===
    "documents"
      ? "documents"
      : resolvedSearchParams?.module ===
          "actions"
        ? "actions"
        : undefined;

  if (!principal) {
    redirect(
      "/login?next=%2Ffrench-ward%2Fhome",
    );
  }

  const governingStanding =
    await loadCurrentFrenchWardGoverningStandingWithClient({
      client: prisma,
      userId: principal.userId,
    });

  const adminReview =
    principal.roles.includes("ADMIN_PLATFORM");

  if (
    !adminReview &&
    !governingStanding?.active
  ) {
    redirect("/french-ward");
  }

  const [
    sendLoiAuthority,
    registerBuyerTransactionAuthority,
    promoteIntakeToOpportunityAuthority,
  ] = await Promise.all([
    resolveFrenchWardActionAuthorityWithClient({
      client: prisma,
      userId: principal.userId,
      action:
        FRENCH_WARD_ACTION.SEND_LOI,
    }),

    resolveFrenchWardActionAuthorityWithClient({
      client: prisma,
      userId: principal.userId,
      action:
        FRENCH_WARD_ACTION.REGISTER_BUYER_TRANSACTION,
    }),

    resolveFrenchWardActionAuthorityWithClient({
      client: prisma,
      userId: principal.userId,
      action:
        FRENCH_WARD_ACTION.PROMOTE_INTAKE_TO_OPPORTUNITY,
    }),
  ]);

  const actions = {
    governing:
      Boolean(governingStanding?.active),

    sendLoi:
      sendLoiAuthority.allowed,

    registerBuyerTransaction:
      registerBuyerTransactionAuthority.allowed,

    promoteIntakeToOpportunity:
      promoteIntakeToOpportunityAuthority.allowed,
  };

  const home =
    await loadFrenchWardHomeWithClient({
      client: prisma,

      participant: governingStanding?.active
        ? {
            name:
              governingStanding.displayName,
            institutionalTitle:
              governingStanding.institutionalTitle,
            secondaryTitle:
              governingStanding.secondaryTitle,
            reference:
              governingStanding.reference,
            governing: true,
            administrativeReview: false,
          }
        : {
            name: "Platform Administration",
            institutionalTitle:
              "Administrative Review",
            secondaryTitle: null,
            reference: null,
            governing: false,
            administrativeReview:
              adminReview,
          },
    });

  return (
    <HomeWorkspaceShell
      home={home}
      actions={{
        ...actions,
        sendLoi: false,
        registerBuyerTransaction: false,
        promoteIntakeToOpportunity: false,
      }}
      initialModule={initialModule}
    />
  );
}
