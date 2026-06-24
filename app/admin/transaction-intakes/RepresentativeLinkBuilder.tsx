"use client";

import { useMemo, useState } from "react";

const programOptions = [
  "French-Ward Gold",
  "Bafoula Cooperative",
  "AXPT Strategic Intake",
  "General",
  "Other",
] as const;

function buildQuery(params: Record<string, string>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    const trimmed = value.trim();

    if (trimmed) {
      searchParams.set(key, trimmed);
    }
  });

  return searchParams.toString();
}

export default function RepresentativeLinkBuilder() {
  const [origin, setOrigin] = useState("");
  const [referralCode, setReferralCode] = useState("FW-REP-001");
  const [representativeName, setRepresentativeName] = useState("");
  const [program, setProgram] = useState("French-Ward Gold");
  const [copied, setCopied] = useState<string | null>(null);

  useMemo(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const publicQuery = buildQuery({
    ref: referralCode,
    rep: representativeName,
    program,
  });

  const adminQuery = buildQuery({
    ref: referralCode,
  });

  const publicLink = `${origin}/transaction-intake${
    publicQuery ? `?${publicQuery}` : ""
  }`;

  const adminFilterLink = `${origin}/admin/transaction-intakes${
    adminQuery ? `?${adminQuery}` : ""
  }`;

  async function copyToClipboard(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);

      window.setTimeout(() => {
        setCopied(null);
      }, 1800);
    } catch {
      setCopied("Unable to copy");
    }
  }

  return (
    <div className="rounded border border-gray-800 bg-black p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Referral Code
          </span>
          <input
            value={referralCode}
            onChange={(event) => setReferralCode(event.target.value)}
            placeholder="FW-REP-001"
            className="rounded border border-gray-700 bg-black px-3 py-2 text-sm text-white"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Representative Name
          </span>
          <input
            value={representativeName}
            onChange={(event) => setRepresentativeName(event.target.value)}
            placeholder="Representative Name"
            className="rounded border border-gray-700 bg-black px-3 py-2 text-sm text-white"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Program
          </span>
          <select
            value={program}
            onChange={(event) => setProgram(event.target.value)}
            className="rounded border border-gray-700 bg-black px-3 py-2 text-sm text-white"
          >
            {programOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded border border-gray-800 bg-gray-950 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Public Intake Link
          </p>
          <p className="mt-2 break-all font-mono text-xs text-gray-300">
            {publicLink}
          </p>
          <button
            type="button"
            onClick={() => copyToClipboard("Public intake link", publicLink)}
            className="mt-3 rounded border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-500/20"
          >
            Copy Intake Link
          </button>
        </div>

        <div className="rounded border border-gray-800 bg-gray-950 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Admin Referral Filter
          </p>
          <p className="mt-2 break-all font-mono text-xs text-gray-300">
            {adminFilterLink}
          </p>
          <button
            type="button"
            onClick={() =>
              copyToClipboard("Admin referral filter", adminFilterLink)
            }
            className="mt-3 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
          >
            Copy Filter Link
          </button>
        </div>
      </div>

      {copied ? (
        <p className="mt-3 text-xs text-emerald-300">{copied} copied.</p>
      ) : null}
    </div>
  );
}
