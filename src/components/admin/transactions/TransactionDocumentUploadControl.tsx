"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  transactionReference: string;
  documentKind: "SPA" | "COMMERCIAL_SCHEDULE";
  label: string;
};

export function TransactionDocumentUploadControl({
  transactionReference,
  documentKind,
  label,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [state, setState] = useState<
    "idle" | "uploading" | "complete" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function publish(file: File) {
    setState("uploading");
    setMessage(null);

    try {
      const response = await fetch(
        `/api/admin/transactions/${encodeURIComponent(
          transactionReference,
        )}/documents/${documentKind}/issue`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/pdf",
          },
          body: file,
        },
      );

      const body = (await response.json()) as {
        ok?: boolean;
        error?: string;
        detail?: string;
      };

      if (!response.ok || !body.ok) {
        throw new Error(body.detail ?? body.error ?? "Upload failed");
      }

      setState("complete");
      setMessage("Issued copy published");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="flex flex-col items-start gap-1 md:items-end">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            void publish(file);
          }
        }}
      />
      <button
        type="button"
        disabled={state === "uploading"}
        onClick={() => inputRef.current?.click()}
        className="rounded border border-amber-900/70 px-3 py-1.5 text-[10px] uppercase tracking-wide text-amber-300 disabled:cursor-wait disabled:opacity-60"
      >
        {state === "uploading" ? "Publishing…" : label}
      </button>
      {message ? (
        <span
          className={
            state === "error"
              ? "max-w-xs text-right text-[10px] text-rose-300"
              : "max-w-xs text-right text-[10px] text-stone-500"
          }
        >
          {message}
        </span>
      ) : null}
    </div>
  );
}
