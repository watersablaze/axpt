import type { Metadata } from "next";
import { redirect } from "next/navigation";

import HomeWorkspaceShell from "./HomeWorkspaceShell";
import { createPassageRehearsalMatters } from "./passageRehearsal";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { PERMISSIONS } from "@/domains/auth/permissions";
import {
  loadCurrentFrenchWardGoverningStandingWithClient,
} from "@/domains/institutions/french-ward/governance/loadCurrentFrenchWardGoverningStandingWithClient";
import {
  loadFrenchWardHomeWithClient,
} from "@/domains/institutions/french-ward/home/loadFrenchWardHomeWithClient";
import {
  loadCurrentFrenchWardInstitutionalParticipantWithClient,
} from "@/domains/institutions/french-ward/participants/loadCurrentFrenchWardInstitutionalParticipantWithClient";
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
    post?: string;
    passageRehearsal?: string;
  }>;
}) {
  const principal = await getPrincipal();

  const resolvedSearchParams =
    await searchParams;

  if (!principal) {
    const requestedPost =
      resolvedSearchParams?.module === "bulletin" &&
      typeof resolvedSearchParams.post === "string" &&
      resolvedSearchParams.post.length > 0 &&
      resolvedSearchParams.post.length <= 128
        ? resolvedSearchParams.post
        : null;

    const returnPath = requestedPost
      ? `/french-ward/home?module=bulletin&post=${encodeURIComponent(requestedPost)}`
      : "/french-ward/home";

    redirect(`/login?next=${encodeURIComponent(returnPath)}`);
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

  const adminReview =
    principal.roles.includes("ADMIN_PLATFORM");
  const canReadArpRegister = Boolean(governingStanding?.active);
  const canReadBulletin =
    Boolean(governingStanding?.active) ||
    principal.permissions.includes(PERMISSIONS.FRENCH_WARD_BULLETIN_PUBLISH);

  if (
    !adminReview &&
    !governingStanding?.active &&
    !institutionalParticipant?.active
  ) {
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

  if (!completed) {
    redirect("/french-ward/orientation");
  }

  const initialModule =
    resolvedSearchParams?.module ===
    "documents"
      ? "documents"
      : resolvedSearchParams?.module ===
          "actions"
        ? "actions"
        : resolvedSearchParams?.module === "bulletin" && canReadBulletin
          ? "bulletin"
          : resolvedSearchParams?.module === "arp" && canReadArpRegister
            ? "arp"
            : undefined;

  const now = new Date();
  const arpAppointments = canReadArpRegister
    ? await prisma.representativeProgramAppointment.findMany({
        where: {
          participant: { standing: "ACTIVE" },
          instrument: { status: { in: ["EXECUTED", "ACTIVE"] } },
          effectiveAt: { lte: now },
          endedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        orderBy: [{ participant: { displayName: "asc" } }, { id: "asc" }],
        select: {
          id: true,
          appointmentClass: true,
          effectiveAt: true,
          expiresAt: true,
          participant: { select: { displayName: true, docketReference: true } },
          instrument: { select: { reference: true } },
        },
      })
    : null;

  const bulletinPosts = canReadBulletin
    ? await prisma.frenchWardBulletinPost.findMany({
        where: { publishedAt: { not: null } },
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        select: { id: true, title: true, body: true, publishedAt: true, urgent: true, pdfName: true },
      })
    : null;

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
      canViewLiveMatters: adminReview || Boolean(governingStanding?.active),

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
            kind:
              "GOVERNING",
            capacityClass:
              null,
          }
        : institutionalParticipant?.active
          ? {
              name:
                institutionalParticipant.displayName,
              institutionalTitle:
                institutionalParticipant.institutionalTitle,
              secondaryTitle:
                institutionalParticipant.secondaryTitle,
              reference:
                institutionalParticipant.reference,
              kind:
                "INSTITUTIONAL",
              capacityClass:
                institutionalParticipant.capacityClass,
            }
          : {
              name:
                principal.displayName?.trim() ||
                principal.email,
              institutionalTitle:
                "Administrative Review",
              secondaryTitle:
                null,
              reference:
                null,
              kind:
                "ADMINISTRATIVE_REVIEW",
              capacityClass:
                null,
            },
    });

  return (
    <HomeWorkspaceShell
      home={home}
      passageRehearsal={
        process.env.NODE_ENV === "development" &&
        resolvedSearchParams?.passageRehearsal === "1"
          ? createPassageRehearsalMatters(now)
          : undefined
      }
      actions={actions}
      initialModule={initialModule}
      initialBulletinPostId={
        initialModule === "bulletin" &&
        typeof resolvedSearchParams?.post === "string" &&
        resolvedSearchParams.post.length <= 128
          ? resolvedSearchParams.post
          : undefined
      }
      arpAppointments={arpAppointments?.map((appointment) => ({
        ...appointment,
        effectiveAt: appointment.effectiveAt?.toISOString() ?? null,
        expiresAt: appointment.expiresAt?.toISOString() ?? null,
      })) ?? null}
      bulletinPosts={bulletinPosts?.flatMap((post) =>
        post.publishedAt
          ? [{ ...post, publishedAt: post.publishedAt.toISOString() }]
          : [],
      ) ?? null}
    />
  );
}
