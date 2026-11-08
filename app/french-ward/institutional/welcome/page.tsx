import type {
  Metadata,
} from "next";

import {
  cookies,
} from "next/headers";

import {
  notFound,
} from "next/navigation";

import {
  FRENCH_WARD_INSTITUTIONAL_INVITATION_COOKIE,
} from "@/domains/institutions/french-ward/participants/invitations/institutionalInvitationAccessCookie";

import {
  loadFrenchWardInstitutionalInvitationStateWithClient,
} from "@/domains/institutions/french-ward/participants/invitations/loadFrenchWardInstitutionalInvitationStateWithClient";

import {
  prisma,
} from "@/infrastructure/db/prisma";

import styles from "./page.module.css";

export const dynamic =
  "force-dynamic";

export const metadata: Metadata = {
  title:
    "French-Ward Institutional Welcome | AXPT",

  description:
    "Private French-Ward institutional invitation.",

  robots: {
    index:
      false,

    follow:
      false,
  },
};

function capacityLabel(
  capacityClass:
    | "STRATEGIC"
    | "OPERATIONS"
    | "FIDUCIARY",
) {
  if (
    capacityClass ===
    "STRATEGIC"
  ) {
    return "Strategic";
  }

  if (
    capacityClass ===
    "OPERATIONS"
  ) {
    return "Operations";
  }

  return "Fiduciary";
}

function formatDate(
  date: Date,
) {
  return new Intl.DateTimeFormat(
    "en",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",

      timeZone:
        "UTC",
    },
  ).format(date);
}

export default async function
FrenchWardInstitutionalWelcomePage() {
  const cookieStore =
    await cookies();

  const credential =
    cookieStore.get(
      FRENCH_WARD_INSTITUTIONAL_INVITATION_COOKIE,
    )?.value ?? null;

  if (!credential) {
    notFound();
  }

  const invitation =
    await loadFrenchWardInstitutionalInvitationStateWithClient({
      client:
        prisma,

      credential,

      now:
        new Date(),
    });

  /*
   * The welcome surface belongs only to the PENDING bearer phase.
   *
   * ACCEPTED invitations are redirected away by ingress and must
   * establish canonical authentication instead of returning here.
   */
  if (
    !invitation ||
    invitation.state !==
      "PENDING"
  ) {
    notFound();
  }

  return (
    <main
      className={
        styles.page
      }
    >
      <section
        className={
          styles.frame
        }
        aria-labelledby="welcome-title"
      >
        <header
          className={
            styles.header
          }
        >
          <div
            className={
              styles.identityLine
            }
          >
            <span>
              AXPT
            </span>

            <span>
              French-Ward · Institutional Invitation
            </span>
          </div>

          <p
            className={
              styles.kicker
            }
          >
            Private Institutional Passage
          </p>

          <h1
            id="welcome-title"
          >
            Welcome to French-Ward.
          </h1>

          <p
            className={
              styles.intro
            }
          >
            You have been invited to enter French-Ward
            in a recognized institutional capacity.
            Review the identity and capacity prepared
            for you before continuing.
          </p>
        </header>

        <section
          className={
            styles.record
          }
          aria-labelledby="invitation-record"
        >
          <div
            className={
              styles.recordHeading
            }
          >
            <p>
              Invitation Record
            </p>

            <span>
              {invitation.reference}
            </span>
          </div>

          <h2
            id="invitation-record"
          >
            {invitation.recipientDisplayName}
          </h2>

          <p
            className={
              styles.title
            }
          >
            {invitation.institutionalTitle}
          </p>

          {
            invitation.secondaryTitle
              ? (
                  <p
                    className={
                      styles.secondaryTitle
                    }
                  >
                    {invitation.secondaryTitle}
                  </p>
                )
              : null
          }

          <dl
            className={
              styles.definitionGrid
            }
          >
            <div>
              <dt>
                Institutional Capacity
              </dt>

              <dd>
                {
                  capacityLabel(
                    invitation.capacityClass,
                  )
                }
              </dd>
            </div>

            <div>
              <dt>
                Participant Reference
              </dt>

              <dd>
                {invitation.participantReference}
              </dd>
            </div>

            <div>
              <dt>
                Recognition Basis
              </dt>

              <dd>
                {invitation.recognitionBasis}
              </dd>
            </div>

            {
              invitation.provenanceReference
                ? (
                    <div>
                      <dt>
                        Provenance
                      </dt>

                      <dd>
                        {invitation.provenanceReference}
                      </dd>
                    </div>
                  )
                : null
            }

            <div>
              <dt>
                Invitation State
              </dt>

              <dd>
                Pending Acceptance
              </dd>
            </div>

            <div>
              <dt>
                Invitation Expires
              </dt>

              <dd>
                {
                  formatDate(
                    invitation.expiresAt,
                  )
                } UTC
              </dd>
            </div>
          </dl>
        </section>

        <section
          className={
            styles.boundary
          }
          aria-labelledby="boundary-title"
        >
          <p
            className={
              styles.smallIndex
            }
          >
            Recognition Boundary
          </p>

          <h2
            id="boundary-title"
          >
            What this invitation establishes
          </h2>

          <p>
            Acceptance records your institutional
            participation in French-Ward and allows
            your identity to enter the established
            authentication and Orientation passage.
          </p>

          <p>
            This invitation does not by itself grant
            governing standing, commercial authority,
            instrument authority, representative
            authority, payment authority, or
            unrestricted access to institutional
            resources.
          </p>
        </section>

        <footer
          className={
            styles.footer
          }
        >
          <span>
            French-Ward, Inc.
          </span>

          <span>
            Invitation review only · No acceptance recorded
          </span>
        </footer>
      </section>
    </main>
  );
}
