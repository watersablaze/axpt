import "server-only";

import type { loadFrenchWardMatterWithClient } from "@/domains/institutions/french-ward/matters/loadFrenchWardMatterWithClient";

type LoadedMatter = NonNullable<Awaited<ReturnType<typeof loadFrenchWardMatterWithClient>>>;

const samples = [
  { key: "LINKED", title: "Rehearsal · Northstar Buyer", status: "IN_REVIEW" },
  { key: "UNLINKED", title: "Rehearsal · Meridian Buyer", status: "SUBMITTED" },
] as const;

function buildMatter(sample: typeof samples[number]): LoadedMatter {
  const id = `fw-rehearsal-matter-${sample.key.toLowerCase()}`;
  const reference = `AXPT-MAT-REHEARSAL-${sample.key}`;

  return {
    matter: {
      id,
      reference,
      institutionalDomain: "FRENCH_WARD",
      institutionalPrincipal: { name: "French-Ward, Inc." },
      coordinationEnvironment: "AXPT",
      matterKind: "COMMERCIAL_TRANSACTION",
      canonicalRecord: {
        kind: "INTAKE",
        id: `fw-rehearsal-intake-${sample.key.toLowerCase()}`,
        reference: `FW-REHEARSAL-INTAKE-${sample.key}`,
      },
    },
    homeMatter: {
      id,
      reference,
      title: sample.title,
      recordKind: "INTAKE",
      stage: "RECEIVED",
      state: sample.status,
      commodity: "Gold doré",
      origin: "Mali",
      quantityKg: "50",
      parties: [],
      lastMovement: null,
      pendingAttentionCount: 0,
    },
    movement: [],
  };
}

export function buyerLifecycleRehearsalMatters() {
  return process.env.NODE_ENV === "development"
    ? samples.map((sample) => buildMatter(sample).homeMatter)
    : [];
}

export function loadBuyerLifecycleRehearsal(reference: string) {
  if (process.env.NODE_ENV !== "development") return null;

  const sample = samples.find(({ key }) => reference === `AXPT-MAT-REHEARSAL-${key}`);
  if (!sample) return null;

  return {
    loaded: buildMatter(sample),
    access: sample.key === "LINKED" ? {
      requestId: "FW-REHEARSAL-ACCESS-LINKED",
      requestStatus: "APPROVED",
      grantStatus: "Unexpired",
    } : null,
  };
}
