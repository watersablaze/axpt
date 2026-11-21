export type ExternalIntakeProvenance = {
  version: 1 | 2;
  originator: string;
  introductionChannelName: string | null;
  operationalReference: string;
  evidenceReference: string;
  evidenceSha256: string;
};

export function readExternalIntakeProvenance(
  note: string | null | undefined,
): ExternalIntakeProvenance | null {
  if (!note) return null;

  try {
    const record: unknown = JSON.parse(note);

    if (
      !record ||
      typeof record !== "object" ||
      Array.isArray(record)
    ) return null;

    const data = record as Record<string, unknown>;

    if (data.version !== 1 && data.version !== 2) return null;

    for (const key of [
      "originator",
      "operationalReference",
      "evidenceReference",
    ]) {
      if (
        typeof data[key] !== "string" ||
        !(data[key] as string).trim()
      ) return null;
    }

    if (
      typeof data.evidenceSha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(data.evidenceSha256)
    ) return null;

    if (
      data.introductionChannelName !== undefined &&
      (typeof data.introductionChannelName !== "string" ||
        !data.introductionChannelName.trim())
    ) return null;

    return {
      version: data.version,
      originator: data.originator as string,
      introductionChannelName:
        typeof data.introductionChannelName === "string"
          ? data.introductionChannelName
          : null,
      operationalReference: data.operationalReference as string,
      evidenceReference: data.evidenceReference as string,
      evidenceSha256: data.evidenceSha256,
    };
  } catch {
    return null;
  }
}
