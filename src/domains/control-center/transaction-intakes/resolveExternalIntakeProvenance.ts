import {
  readExternalIntakeProvenance,
  type ExternalIntakeProvenance,
} from "./readExternalIntakeProvenance";

export const EXTERNAL_INTAKE_PROVENANCE_CORRECTED =
  "EXTERNAL_INTAKE_PROVENANCE_CORRECTED";

export type ExternalIntakeProvenanceCorrectionField =
  "introductionChannelName";

export type ExternalIntakeProvenanceCorrection = Readonly<{
  version: 1;
  field: ExternalIntakeProvenanceCorrectionField;
  from: string | null;
  to: string;
  reason: string;
  actorUserId: string;
}>;

type EventLike = Readonly<{
  eventType: string;
  note: string | null;
  createdAt: Date | string;
}>;

function requiredString(
  value: unknown,
): string | null {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  return value.trim();
}

export function readExternalIntakeProvenanceCorrection(
  note: string | null,
): ExternalIntakeProvenanceCorrection | null {
  if (!note) return null;

  try {
    const data = JSON.parse(note) as Record<
      string,
      unknown
    >;

    if (
      data.version !== 1 ||
      data.field !== "introductionChannelName"
    ) {
      return null;
    }

    const to = requiredString(data.to);
    const reason = requiredString(data.reason);
    const actorUserId = requiredString(
      data.actorUserId,
    );

    if (!to || !reason || !actorUserId) {
      return null;
    }

    const from =
      data.from === null
        ? null
        : requiredString(data.from);

    if (
      data.from !== null &&
      from === null
    ) {
      return null;
    }

    return {
      version: 1,
      field: "introductionChannelName",
      from,
      to,
      reason,
      actorUserId,
    };
  } catch {
    return null;
  }
}

export function resolveExternalIntakeProvenance(
  events: readonly EventLike[],
): ExternalIntakeProvenance | null {
  const ordered = [...events].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime(),
  );

  const registration = ordered.find(
    (event) =>
      event.eventType ===
      "EXTERNAL_INTAKE_REGISTERED",
  );

  const base = readExternalIntakeProvenance(
    registration?.note ?? null,
  );

  if (!base) {
    return null;
  }

  let resolved: ExternalIntakeProvenance = {
    ...base,
  };

  for (const event of ordered) {
    if (
      event.eventType !==
      EXTERNAL_INTAKE_PROVENANCE_CORRECTED
    ) {
      continue;
    }

    const correction =
      readExternalIntakeProvenanceCorrection(
        event.note,
      );

    if (!correction) {
      continue;
    }

    if (
      correction.field ===
      "introductionChannelName"
    ) {
      if (
        correction.from !==
        resolved.introductionChannelName
      ) {
        continue;
      }

      resolved = {
        ...resolved,
        introductionChannelName:
          correction.to,
      };
    }
  }

  return resolved;
}
