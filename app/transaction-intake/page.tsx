import CommercialIntakePresentation from "./CommercialIntakePresentation";
import type { Metadata } from "next";


import {
  getPrincipal,
} from "@/domains/auth/getPrincipal";

import {
  resolveInstitutionalAccessWithClient,
} from "@/domains/institutional-access/resolveInstitutionalAccessWithClient";

import {
  FRENCH_WARD_COMMERCIAL_INTAKE,
} from "@/domains/institutions/french-ward/commercial";

import {
  prisma,
} from "@/infrastructure/db/prisma";


export const metadata: Metadata = {
  title:
    "Letter of Intent & Transaction Intake — French-Ward",
  description:
    "French-Ward preliminary commercial alignment and controlled transaction intake instrument.",
};

type Props = {
  searchParams?: Promise<{
    ref?: string;
    rep?: string;
    program?: string;
  }>;
};

export default async function TransactionIntakePage({
  searchParams,
}: Props) {
  const params = await searchParams;

  const referralCode = params?.ref || "";
  const representativeName = params?.rep || "";
  const program = params?.program || "";

  const principal =
    await getPrincipal();

  const access =
    principal
      ? await resolveInstitutionalAccessWithClient({
          client:
            prisma,

          identity: {
            userId:
              principal.userId,

            email:
              principal.email,
          },

          scope:
            FRENCH_WARD_COMMERCIAL_INTAKE
              .accessScope,

          action:
            "VIEW_FORM",

          resourceReference:
            FRENCH_WARD_COMMERCIAL_INTAKE
              .reference,

          resourceVersion:
            FRENCH_WARD_COMMERCIAL_INTAKE
              .version,
        })
      : {
          allowed:
            false,
        } as const;

  return <CommercialIntakePresentation
    allowed={access.allowed}
    referralCode={referralCode}
    representativeName={representativeName}
    program={program}
    initialName={principal?.displayName ?? ""}
    initialEmail={principal?.email ?? ""}
  />;
}
