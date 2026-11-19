import type {
  Metadata,
} from "next";

import Link from "next/link";
import { isAdmin } from "@/domains/auth/isAdmin";

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
    isAdmin(principal);

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
        {administrativeReview ? (
          <a
            href="/api/admin/french-ward/documents/tov/pdf"
            download="FW-TOV-2026-001-Edition01-R04.pdf"
            style={{
              color: "#ecf3ed",
              border: "1px solid #7e9894",
              borderRadius: 6,
              padding: "8px 12px",
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Download approved PDF
          </a>
        ) : null}
      </nav>

      <TovPublicationView />
    </main>
  );
}
