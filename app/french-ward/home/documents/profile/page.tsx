import type {
  Metadata,
} from "next";

import Link from "next/link";

import styles from "../../home.module.css";
import {
  redirect,
} from "next/navigation";

import {
  FrenchWardInstitutionalProfileView,
} from "@/components/french-ward/profile/FrenchWardInstitutionalProfileView";

import {
  getPrincipal,
} from "@/domains/auth/getPrincipal";

import {
  loadCurrentFrenchWardGoverningStandingWithClient,
} from "@/domains/institutions/french-ward/governance/loadCurrentFrenchWardGoverningStandingWithClient";

import {
  projectFrenchWardInstitutionalProfile,
} from "@/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile";

import {
  prisma,
} from "@/lib/prisma";

export const metadata: Metadata = {
  title:
    "French-Ward Institutional Profile",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function
FrenchWardHomeProfileDocumentPage() {
  const principal =
    await getPrincipal();

  if (!principal) {
    redirect(
      "/login?next=%2Ffrench-ward%2Fhome%2Fdocuments%2Fprofile",
    );
  }

  const standing =
    await loadCurrentFrenchWardGoverningStandingWithClient({
      client: prisma,
      userId: principal.userId,
    });

  const administrativeReview =
    principal.roles.includes(
      "ADMIN_PLATFORM",
    );

  if (
    !standing?.active &&
    !administrativeReview
  ) {
    redirect(
      "/french-ward/home",
    );
  }

  const profile =
    projectFrenchWardInstitutionalProfile();

  return (
    <main>
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
          French-Ward Institutional Profile
        </span>
      </nav>

      <FrenchWardInstitutionalProfileView
        profile={profile}
      />
    </main>
  );
}
