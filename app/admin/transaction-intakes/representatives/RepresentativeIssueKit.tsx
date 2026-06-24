"use client";

import { useEffect, useMemo, useState } from "react";

type IssueKitRepresentative = {
  id: string;
  code: string;
  name: string;
  email: string | null;
  company: string | null;
  program: string | null;
  status: string;
};

type Props = {
  representatives: IssueKitRepresentative[];
};

function buildQuery(params: Record<string, string | null | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    const trimmed = value?.trim();

    if (trimmed) {
      searchParams.set(key, trimmed);
    }
  });

  return searchParams.toString();
}

export default function RepresentativeIssueKit({ representatives }: Props) {
  const [origin, setOrigin] = useState("");
  const [selectedRepresentativeId, setSelectedRepresentativeId] = useState(
    representatives[0]?.id ?? "",
  );
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!selectedRepresentativeId && representatives[0]) {
      setSelectedRepresentativeId(representatives[0].id);
    }
  }, [representatives, selectedRepresentativeId]);

  const selectedRepresentative = useMemo(
    () =>
      representatives.find(
        (representative) => representative.id === selectedRepresentativeId,
      ) ?? representatives[0],
    [representatives, selectedRepresentativeId],
  );

  const publicQuery = selectedRepresentative
    ? buildQuery({
        ref: selectedRepresentative.code,
        rep: selectedRepresentative.name,
        program: selectedRepresentative.program,
      })
    : "";

  const adminQuery = selectedRepresentative
    ? buildQuery({
        ref: selectedRepresentative.code,
      })
    : "";

  const publicIntakeLink =
    selectedRepresentative && origin
      ? `${origin}/transaction-intake?${publicQuery}`
      : "";

  const adminReferralLaneLink =
    selectedRepresentative && origin
      ? `${origin}/admin/transaction-intakes?${adminQuery}`
      : "";

  const buyerMessage = selectedRepresentative
    ? [
        `Hello,`,
        ``,
        `Please complete the AXPT transaction intake using the secure link below. This form allows our review desk to confirm buyer-side transaction details, readiness materials, and representative attribution before any document issuance is considered.`,
        ``,
        publicIntakeLink,
        ``,
        `Referral Code: ${selectedRepresentative.code}`,
        `Representative: ${selectedRepresentative.name}`,
        selectedRepresentative.program
          ? `Program: ${selectedRepresentative.program}`
          : null,
        ``,
        `Please complete the form accurately and only submit information you are authorized to provide.`,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const representativeInstruction = selectedRepresentative
    ? [
        `Representative Issue Instructions`,
        ``,
        `Representative: ${selectedRepresentative.name}`,
        `Referral Code: ${selectedRepresentative.code}`,
        selectedRepresentative.company
          ? `Company: ${selectedRepresentative.company}`
          : null,
        selectedRepresentative.email
          ? `Email: ${selectedRepresentative.email}`
          : null,
        selectedRepresentative.program
          ? `Program: ${selectedRepresentative.program}`
          : null,
        `Status: ${selectedRepresentative.status}`,
        ``,
        `Buyer Intake Link:`,
        publicIntakeLink,
        ``,
        `Admin Referral Lane:`,
        adminReferralLaneLink,
        ``,
        `Instruction: Send only the buyer intake link to the buyer. Do not promise approval, document issuance, commission, allocation, or execution. The intake is a review gate only.`,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  async function copyToClipboard(label: string, value: string) {
    if (!value) {
      return;
    }

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

  if (representatives.length === 0) {
    return (
      <section className="mb-6 rounded border border-gray-800 bg-gray-950 p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
          Representative Issue Kit
        </p>
        <h2 className="mt-2 text-lg font-semibold">
          No active representatives
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          Create an active representative before issuing buyer intake links.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-6 rounded border border-emerald-500/20 bg-emerald-950/10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/70">
            Representative Issue Kit
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">
            Issue Buyer Intake Link
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-gray-300">
            Select a representative and copy the controlled issue materials.
            This keeps buyer links, referral lanes, and messaging aligned.
          </p>
        </div>

        {copied ? (
          <div className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200">
            {copied} copied.
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Representative
          </span>
          <select
            value={selectedRepresentativeId}
            onChange={(event) =>
              setSelectedRepresentativeId(event.target.value)
            }
            className="rounded border border-gray-700 bg-black px-3 py-2 text-sm text-white"
          >
            {representatives.map((representative) => (
              <option key={representative.id} value={representative.id}>
                {representative.code} · {representative.name}
                {representative.program ? ` · ${representative.program}` : ""}
                {representative.status === "PAUSED" ? " · PAUSED" : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded border border-gray-800 bg-black px-3 py-2 text-xs text-gray-400">
          {selectedRepresentative?.status ?? "UNKNOWN"}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded border border-gray-800 bg-black p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Public Buyer Intake Link
          </p>
          <p className="mt-3 break-all font-mono text-xs text-gray-300">
            {publicIntakeLink}
          </p>
          <button
            type="button"
            onClick={() =>
              copyToClipboard("Buyer intake link", publicIntakeLink)
            }
            className="mt-4 rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20"
          >
            Copy Buyer Link
          </button>
        </div>

        <div className="rounded border border-gray-800 bg-black p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Admin Referral Lane
          </p>
          <p className="mt-3 break-all font-mono text-xs text-gray-300">
            {adminReferralLaneLink}
          </p>
          <button
            type="button"
            onClick={() =>
              copyToClipboard("Admin referral lane", adminReferralLaneLink)
            }
            className="mt-4 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
          >
            Copy Admin Lane
          </button>
        </div>

        <div className="rounded border border-gray-800 bg-black p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Buyer Message
          </p>
          <pre className="mt-3 max-h-72 whitespace-pre-wrap rounded border border-gray-900 bg-gray-950 p-3 text-xs leading-5 text-gray-300">
            {buyerMessage}
          </pre>
          <button
            type="button"
            onClick={() => copyToClipboard("Buyer message", buyerMessage)}
            className="mt-4 rounded border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-500/20"
          >
            Copy Buyer Message
          </button>
        </div>

        <div className="rounded border border-gray-800 bg-black p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
            Internal Rep Instruction
          </p>
          <pre className="mt-3 max-h-72 whitespace-pre-wrap rounded border border-gray-900 bg-gray-950 p-3 text-xs leading-5 text-gray-300">
            {representativeInstruction}
          </pre>
          <button
            type="button"
            onClick={() =>
              copyToClipboard("Rep instruction", representativeInstruction)
            }
            className="mt-4 rounded border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-200 hover:bg-purple-500/20"
          >
            Copy Rep Instruction
          </button>
        </div>
      </div>
    </section>
  );
}
