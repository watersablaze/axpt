import type {
  Metadata,
} from "next";

import Link from "next/link";

import styles from "../../home.module.css";
import {
  redirect,
} from "next/navigation";

import {
  TovPublicationView,
} from "@/components/french-ward/transaction-overview/TovPublicationView";

import {
  getPrincipal,
} from "@/domains/auth/getPrincipal";

import {
  loadCurrentFrenchWardGoverningStandingWithClient,
} from "@/domains/institutions/french-ward/governance/loadCurrentFrenchWardGoverningStandingWithClient";

import {
  loadCurrentFrenchWardInstitutionalParticipantWithClient,
} from "@/domains/institutions/french-ward/participants/loadCurrentFrenchWardInstitutionalParticipantWithClient";

import {
  prisma,
} from "@/lib/prisma";

export const metadata: Metadata = {
  title:
    "French-Ward Transaction Overview",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function
FrenchWardHomeTovDocumentPage() {
  const principal =
    await getPrincipal();

  if (!principal) {
    redirect(
      "/login?next=%2Ffrench-ward%2Fhome%2Fdocuments%2Ftov",
    );
  }

  const standing =
    await loadCurrentFrenchWardGoverningStandingWithClient({
      client: prisma,
      userId: principal.userId,
    });

  const institutionalParticipant =
    await loadCurrentFrenchWardInstitutionalParticipantWithClient({
      client: prisma,
      userId: principal.userId,
    });

  const administrativeReview =
    principal.roles.includes(
      "ADMIN_PLATFORM",
    );

  if (
    !standing?.active &&
    !institutionalParticipant?.active &&
    !administrativeReview
  ) {
    redirect(
      "/french-ward/home",
    );
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#0b1012",
      }}
    >
      <nav
        className={
          styles.documentReturn
        }
        aria-label="Document navigation"
      >
        <Link
          href="/french-ward/home?module=documents"
          prefetch={false}
        >
          ← Back to Documents
        </Link>

        <span>
          Transaction Overview
        </span>
      </nav>

      <TovPublicationView />
    </main>
  );
}
