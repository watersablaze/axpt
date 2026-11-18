import type { Metadata } from "next";
import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { PERMISSIONS } from "@/domains/auth/permissions";
import {
  loadCurrentFrenchWardGoverningStandingWithClient,
} from "@/domains/institutions/french-ward/governance/loadCurrentFrenchWardGoverningStandingWithClient";
import {
  loadFrenchWardMatterWithClient,
} from "@/domains/institutions/french-ward/matters/loadFrenchWardMatterWithClient";
import {
  loadCurrentFrenchWardInstitutionalParticipantWithClient,
} from "@/domains/institutions/french-ward/participants/loadCurrentFrenchWardInstitutionalParticipantWithClient";
import { prisma } from "@/lib/prisma";

import { loadBuyerLifecycleRehearsal } from "../buyerLifecycleRehearsal";
import styles from "./matter.module.css";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

export const metadata: Metadata = {
  title:
    "French-Ward Matter",

  robots: {
    index:
      false,

    follow:
      false,
  },

  referrer:
    "no-referrer",
};

function humanize(
  value: string,
) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase(),
    );
}

export default async function FrenchWardMatterPage({
  params,
}: {
  params: Promise<{
    reference: string;
  }>;
}) {
  const {
    reference: encodedReference,
  } = await params;

  let reference: string;

  try {
    reference =
      decodeURIComponent(
        encodedReference,
      ).trim();
  } catch {
    notFound();
  }

  if (
    !reference ||
    reference.length > 191 ||
    !reference.startsWith(
      "AXPT-MAT-",
    )
  ) {
    notFound();
  }

  const principal =
    await getPrincipal();

  if (!principal) {
    const next =
      `/french-ward/matters/${encodeURIComponent(
        reference,
      )}`;

    redirect(
      `/login?next=${encodeURIComponent(
        next,
      )}`,
    );
  }

  const governingStanding =
    await loadCurrentFrenchWardGoverningStandingWithClient({
      client:
        prisma,

      userId:
        principal.userId,
    });

  const institutionalParticipant =
    await loadCurrentFrenchWardInstitutionalParticipantWithClient({
      client:
        prisma,

      userId:
        principal.userId,
    });

  const adminReview =
    principal.roles.includes(
      "ADMIN_PLATFORM",
    );

  if (
    !adminReview &&
    !governingStanding?.active &&
    !institutionalParticipant?.active
  ) {
    redirect(
      "/french-ward",
    );
  }

  if (!adminReview && !governingStanding?.active) {
    notFound();
  }

  const rehearsal = loadBuyerLifecycleRehearsal(reference);
  const loaded = rehearsal?.loaded ??
    await loadFrenchWardMatterWithClient({
      client:
        prisma,

      matterReference:
        reference,
    });

  if (!loaded) {
    notFound();
  }

  const {
    matter,
    homeMatter,
    movement,
  } = loaded;

  const canManageAccess = isAdmin(principal) && principal.permissions.includes(
    PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE,
  );
  const submissionEvents = canManageAccess && !rehearsal
    ? await prisma.institutionalAccessEvent.findMany({
        where: {
          type: "INTAKE_SUBMITTED",
          request: { scope: "LOI_INTAKE_ACCESS" },
          grant: { is: { scope: "LOI_INTAKE_ACCESS" } },
          AND: [
            { metadata: { path: ["intakeId"], equals: matter.canonicalRecord.id } },
            { metadata: { path: ["intakeReference"], equals: matter.canonicalRecord.reference } },
          ],
        },
        select: {
          requestId: true,
          request: { select: { status: true } },
          grant: { select: { requestId: true, revokedAt: true, expiresAt: true } },
        },
        take: 2,
      })
    : [];
  const [submission] = submissionEvents;
  const recordedAccess =
    submissionEvents.length === 1 &&
    submission?.grant &&
    submission.grant.requestId === submission.requestId
      ? {
          requestId: submission.requestId,
          requestStatus: submission.request.status,
          grantStatus: submission.grant.revokedAt
            ? "Revoked"
            : submission.grant.expiresAt <= new Date()
              ? "Expired"
              : "Unexpired",
        }
      : null;

  const linkedAccess = canManageAccess && rehearsal ? rehearsal.access : recordedAccess;

  const participant =
    governingStanding?.active
      ? {
          name:
            governingStanding.displayName,

          title:
            governingStanding.institutionalTitle,

          kind:
            "GOVERNING" as const,
        }
      : institutionalParticipant?.active
        ? {
            name:
              institutionalParticipant.displayName,

            title:
              institutionalParticipant.institutionalTitle,

            kind:
              "INSTITUTIONAL" as const,
          }
        : {
            name:
              "Platform Administration",

            title:
              "Administrative Review",

            kind:
              "ADMINISTRATIVE_REVIEW" as const,
          };

  return (
    <main
      className={
        styles.page
      }
    >
      <header
        className={
          styles.topbar
        }
      >
        <div>
          <Link
            href={rehearsal ? "/french-ward/home?buyerLifecycleRehearsal=1" : "/french-ward/home"}
            className={
              styles.back
            }
          >
            {rehearsal ? "← Rehearsal Matters" : "← French-Ward Home"}
          </Link>

          <span
            className={
              styles.participant
            }
          >
            {participant.name}
            {" · "}
            {participant.title}
          </span>
        </div>

        <span
          className={
            styles.environment
          }
        >
          French-Ward
          {" / "}
          AXPT Continuity
        </span>
      </header>

      <section
        className={
          styles.hero
        }
      >
        <div
          className={
            styles.identity
          }
        >
          <p
            className={
              styles.eyebrow
            }
          >
            Institutional Matter
          </p>

          <code
            className={
              styles.reference
            }
          >
            {
              matter.reference
            }
          </code>

          <h1>
            {
              homeMatter.title
            }
          </h1>

          <p
            className={
              styles.introduction
            }
          >
            Durable French-Ward
            transaction continuity
            coordinated through
            AXPT.
          </p>
        </div>

        <dl
          className={
            styles.posture
          }
        >
          <div>
            <dt>
              Matter stage
            </dt>

            <dd>
              {humanize(
                homeMatter.stage,
              )}
            </dd>
          </div>

          <div>
            <dt>
              {homeMatter.recordKind === "OPPORTUNITY" ? "Opportunity status" : "Intake review status"}
            </dt>

            <dd>
              {humanize(
                homeMatter.state,
              )}
            </dd>
          </div>

          <div>
            <dt>
              Current record
            </dt>

            <dd>
              {
                homeMatter.recordKind
              }
            </dd>
          </div>
        </dl>
      </section>

      <section
        className={
          styles.field
        }
      >
        <article
          className={
            styles.panel
          }
        >
          <header>
            <p
              className={
                styles.index
              }
            >
              01 / Matter
            </p>

            <h2>
              Current field
            </h2>
          </header>

          <dl
            className={
              styles.facts
            }
          >
            <div>
              <dt>
                Institution
              </dt>

              <dd>
                {
                  matter
                    .institutionalPrincipal
                    .name
                }
              </dd>
            </div>

            <div>
              <dt>
                Commodity
              </dt>

              <dd>
                {
                  homeMatter.commodity ??
                  "Not recorded"
                }
              </dd>
            </div>

            <div>
              <dt>
                Quantity
              </dt>

              <dd>
                {
                  homeMatter.quantityKg
                    ? `${homeMatter.quantityKg} kg`
                    : "Not recorded"
                }
              </dd>
            </div>

            <div>
              <dt>
                Origin
              </dt>

              <dd>
                {
                  homeMatter.origin ??
                  "Not recorded"
                }
              </dd>
            </div>
          </dl>
        </article>

        <article
          className={
            styles.panel
          }
        >
          <header>
            <p
              className={
                styles.index
              }
            >
              02 / People
            </p>

            <h2>
              Matter parties
            </h2>
          </header>

          {homeMatter.parties.length ===
          0 ? (
            <p
              className={
                styles.empty
              }
            >
              No parties are
              currently projected.
            </p>
          ) : (
            <div
              className={
                styles.parties
              }
            >
              {homeMatter.parties.map(
                party => (
                  <div
                    key={`${party.role}:${party.legalName}`}
                  >
                    <span>
                      {humanize(
                        party.role,
                      )}
                    </span>

                    <strong>
                      {
                        party.legalName
                      }
                    </strong>
                  </div>
                ),
              )}
            </div>
          )}
        </article>
      </section>

      <section
        className={
          styles.canonical
        }
      >
        <header>
          <div>
            <p
              className={
                styles.index
              }
            >
              03 / Buyer Lifecycle
            </p>

            <h2>
              Buyer Lifecycle
            </h2>
          </div>

          <span
            className={
              styles.recordKind
            }
          >
            {
              matter
                .canonicalRecord
                .kind
            }
          </span>
        </header>

        <div
          className={
            styles.recordIdentity
          }
        >
          <div>
            <span>
              Intake reference
            </span>

            <code>
              {
                matter
                  .canonicalRecord
                  .reference
              }
            </code>
          </div>
        </div>

        <dl className={styles.facts}>
          <div>
            <dt>Intake review status</dt>
            <dd>{humanize(loaded.intakeStatus ?? homeMatter.state)}</dd>
          </div>
          {linkedAccess ? (
            <>
              <div>
                <dt>Access request</dt>
                <dd>{humanize(linkedAccess.requestStatus)}</dd>
              </div>
              <div>
                <dt>Submission grant</dt>
                <dd>{linkedAccess.grantStatus}</dd>
              </div>
            </>
          ) : null}
        </dl>

        {canManageAccess ? (
          linkedAccess && rehearsal ? (
            <p className={styles.recordNote}>Synthetic access request · {linkedAccess.requestId}</p>
          ) : linkedAccess ? (
            <p className={styles.recordNote}>
              <Link
                className={styles.back}
                href={`/admin/institutional-access?requestId=${encodeURIComponent(linkedAccess.requestId)}`}
              >
                Open access request →
              </Link>
            </p>
          ) : (
            <p className={styles.recordNote}>
              {submissionEvents.length > 1
                ? "Multiple access records match this intake."
                : "No linked access record."}
            </p>
          )
        ) : null}

        <p
          className={
            styles.recordNote
          }
        >
          {homeMatter.recordKind === "OPPORTUNITY"
            ? "This intake remains the original record for the Matter’s current Opportunity."
            : "This intake currently holds the Matter’s transaction record."}
        </p>
      </section>

      <section
        className={
          styles.movement
        }
      >
        <header
          className={
            styles.sectionHeader
          }
        >
          <div>
            <p
              className={
                styles.index
              }
            >
              04 / Movement
            </p>

            <h2>
              Transaction history
            </h2>
          </div>

          <span>
            {movement.length
              .toString()
              .padStart(
                2,
                "0",
              )}
            {" / ENTRIES"}
          </span>
        </header>

        {movement.length ===
        0 ? (
          <p
            className={
              styles.empty
            }
          >
            No recorded movement is
            present.
          </p>
        ) : (
          <>
            <div
              className={
                styles.movementColumns
              }
              aria-hidden="true"
            >
              <span>Date</span>
              <span>Movement</span>
              <span>Source</span>
            </div>

            <div
              className={
                styles.timeline
              }
            >
              {movement.map(
                entry => (
                  <article
                    key={
                      entry.id
                    }
                    className={
                      styles.movementRow
                    }
                  >
                    <time
                      dateTime={
                        entry.occurredAt
                      }
                      className={
                        styles.movementDate
                      }
                    >
                      <span>
                        {new Date(
                          entry.occurredAt,
                        ).toLocaleDateString(
                          "en-US",
                          {
                            month:
                              "short",
                            day:
                              "numeric",
                            year:
                              "numeric",
                            timeZone:
                              "UTC",
                          },
                        )}
                      </span>

                      <small>
                        {new Date(
                          entry.occurredAt,
                        ).toLocaleTimeString(
                          "en-US",
                          {
                            hour:
                              "2-digit",
                            minute:
                              "2-digit",
                            hour12:
                              false,
                            timeZone:
                              "UTC",
                          },
                        )}{" "}
                        UTC
                      </small>
                    </time>

                    <div
                      className={
                        styles.movementBody
                      }
                    >
                      <strong>
                        {
                          entry.message
                        }
                      </strong>
                    </div>

                    <div
                      className={
                        styles.provenance
                      }
                    >
                      <span>
                        {
                          entry
                            .sourceRecord
                            .kind
                        }
                      </span>

                      <code>
                        {
                          entry
                            .sourceRecord
                            .reference
                        }
                      </code>
                    </div>
                  </article>
                ),
              )}
            </div>
          </>
        )}
      </section>

      <footer
        className={
          styles.boundary
        }
      >
        <strong>
          Continuity ≠ authority
        </strong>

        <p>
          This workspace records
          institutional continuity.
          Presence here does not by
          itself confer commercial,
          settlement, custodial,
          representative, or
          transaction authority.
        </p>

        {!participant.governing ? (
          <span>
            Administrative review
            posture
          </span>
        ) : null}
      </footer>
    </main>
  );
}
