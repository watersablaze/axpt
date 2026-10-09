import type { Metadata } from "next";

import { projectFrenchWardInstitutionalProfile } from "@/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile";
import FWCorporateHome from "@/components/french-ward/FWCorporateHome";

export const metadata: Metadata = {
  title: "French-Ward — International Trade & Commercial Operations",
  description:
    "French-Ward, Inc. — international trade, source relationships, commercial documentation, delivery coordination, and settlement preparation.",
  openGraph: {
    title: "French-Ward, Inc.",
    description: "International Trade & Commercial Operations",
    type: "website",
  },
};

/** Corporate presence, not a second rendering of the official publication. */
export default function FrenchWardPage() {
  return <FWCorporateHome profile={projectFrenchWardInstitutionalProfile()} />;
}
