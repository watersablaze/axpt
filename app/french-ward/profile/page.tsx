import type { Metadata } from "next";
import Link from "next/link";

import { projectFrenchWardInstitutionalProfile } from "@/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile";
import { FrenchWardInstitutionalProfileView } from "@/components/french-ward/profile/FrenchWardInstitutionalProfileView";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "French-Ward — Official Institutional Profile",
  description: "French-Ward, Inc. — Official Institutional Profile, Edition 02.",
};

/** Public presentation of the identical publication issued via representative CUP. */
export default function PublicFrenchWardProfilePage() {
  const profile = projectFrenchWardInstitutionalProfile();
  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <Link href="/french-ward" className={styles.brand}>French-Ward</Link>
        <nav aria-label="Profile navigation">
          <Link href="/french-ward">Corporate home</Link>
          <Link href="/french-ward/transaction-intake">Commercial intake</Link>
        </nav>
      </header>
      <div className={styles.documentFrame}>
        <div className={styles.context}>
          <span>Official institutional publication</span>
          <span>Edition {String(profile.version).padStart(2, "0")}</span>
        </div>
        <FrenchWardInstitutionalProfileView profile={profile} />
        <p className={styles.afterword}>For institutional correspondence: <a href="mailto:connect@axpt.io">connect@axpt.io</a></p>
      </div>
    </main>
  );
}
