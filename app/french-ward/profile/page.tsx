import type { Metadata } from "next";
import Link from "next/link";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { resolveInstitutionalAccessWithClient } from "@/domains/institutional-access/resolveInstitutionalAccessWithClient";
import { prisma } from "@/infrastructure/db/prisma";
import { projectFrenchWardInstitutionalProfile } from "@/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile";
import { FrenchWardInstitutionalProfileView } from "@/components/french-ward/profile/FrenchWardInstitutionalProfileView";
import ProfileAccessRequest from "@/components/french-ward/profile/ProfileAccessRequest";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "French-Ward — Official Institutional Profile",
  description: "French-Ward, Inc. — Institutional Profile access and official publication.",
};

/** Public reception and permission-checked consumption of the canonical CUP publication. */
export default async function PublicFrenchWardProfilePage() {
  const profile = projectFrenchWardInstitutionalProfile();
  const principal = await getPrincipal();
  const access = principal
    ? await resolveInstitutionalAccessWithClient({
        client: prisma,
        identity: { userId: principal.userId, email: principal.email },
        scope: "PROFILE_VIEW",
        action: "VIEW",
        resourceReference: profile.reference,
        resourceVersion: profile.version,
      })
    : { allowed: false } as const;

  return (
    <main className={styles.page}>
      {access.allowed && (
        <header className={styles.topBar}>
          <Link href="/french-ward" className={styles.brand}>FRENCH-WARD</Link>
          <nav aria-label="Profile navigation">
            <Link href="/french-ward">Corporate home</Link>
            <Link href="/french-ward/transaction-intake">Commercial intake</Link>
          </nav>
        </header>
      )}
      <div className={styles.documentFrame}>
        {access.allowed ? (
          <>
            <FrenchWardInstitutionalProfileView profile={profile} />
            <p className={styles.afterword}>
              For institutional correspondence: <a href="mailto:french-ward@axpt.io">french-ward@axpt.io</a>
            </p>
          </>
        ) : (
          <ProfileAccessRequest
            initialName={principal?.displayName ?? ""}
            initialEmail={principal?.email ?? ""}
          />
        )}
      </div>
    </main>
  );
}
