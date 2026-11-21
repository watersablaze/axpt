import CommercialIntakePresentation from "./CommercialIntakePresentation";
import type { Metadata } from "next";
import { cookies } from "next/headers";


import {
  getPrincipal,
} from "@/domains/auth/getPrincipal";

import {
  FRENCH_WARD_LOI_ACCESS_COOKIE,
} from "@/domains/institutions/french-ward/commercial/loiInvitationCredential";

import {
  resolveFrenchWardCommercialIntakeRequestAccessWithClient,
} from "@/domains/institutions/french-ward/commercial/resolveFrenchWardCommercialIntakeRequestAccessWithClient";

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

  const cookieStore =
    await cookies();

  const credential =
    cookieStore
      .get(
        FRENCH_WARD_LOI_ACCESS_COOKIE,
      )
      ?.value ??
    null;

  const access =
    await resolveFrenchWardCommercialIntakeRequestAccessWithClient({
      client:
        prisma,

      principal:
        principal
          ? {
              userId:
                principal.userId,

              email:
                principal.email,

              displayName:
                principal.displayName,
            }
          : null,

      credential,

      action:
        "VIEW_FORM",
    });

  return <CommercialIntakePresentation
    allowed={access.allowed}
    referralCode={referralCode}
    representativeName={representativeName}
    program={program}
    initialName={
      access.allowed
        ? access.displayName
        : principal?.displayName ?? ""
    }
    initialEmail={
      access.allowed
        ? access.email
        : principal?.email ?? ""
    }
  />;
}
