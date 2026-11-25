"use client";

import { useRef, useState } from "react";

import { BulletinEditorialBody } from
  "../../../french-ward/home/BulletinEditorialBody";
import {
  BULLETIN_BODY_LIMIT,
  BULLETIN_EDITORIAL_V1_PREFIX,
  decodeBulletinBody,
} from "../../../french-ward/home/bulletinEditorial";

type Format = "plain" | "editorial-v1";

type Props = {
  initialBody?: string;
};

const fieldClass =
  "w-full min-w-0 rounded border border-white/25 " +
  "bg-black/20 px-3 py-2 text-sm " +
  "focus-visible:outline focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 focus-visible:outline-amber-200";

const tools = [
  { label: "Heading", before: "## ", after: "" },
  { label: "Bold", before: "**", after: "**" },
  { label: "Italic", before: "*", after: "*" },
  { label: "List", before: "- ", after: "" },
  { label: "Numbered", before: "1. ", after: "" },
  { label: "Quote", before: "> ", after: "" },
  { label: "Divider", before: "\n---\n", after: "" },
];

export default function BulletinEditorialComposer({
  initialBody = "",
}: Props) {
  const initial = decodeBulletinBody(initialBody);
  const [format, setFormat] = useState<Format>(initial.format);
  const [body, setBody] = useState(initial.text);
  const textarea = useRef<HTMLTextAreaElement>(null);

  const previewBody =
    format === "editorial-v1"
      ? BULLETIN_EDITORIAL_V1_PREFIX + body
      : body;

  const storedLength =
    format === "editorial-v1"
      ? BULLETIN_EDITORIAL_V1_PREFIX.length + body.length
      : body.length;

  const withinLimit =
    storedLength <= BULLETIN_BODY_LIMIT;

  function insert(before: string, after: string) {
    const element = textarea.current;
    if (!element) return;

    const start = element.selectionStart;
    const end = element.selectionEnd;
    const selected = body.slice(start, end);
    const replacement = before + selected + after;

    if (
      body.length - (end - start) + replacement.length +
      BULLETIN_EDITORIAL_V1_PREFIX.length >
      BULLETIN_BODY_LIMIT
    ) {
      return;
    }

    const next =
      body.slice(0, start) + replacement + body.slice(end);

    setBody(next);

    requestAnimationFrame(() => {
      element.focus();
      const cursor = start + before.length + selected.length;
      element.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="bulletin-format" className="text-sm font-semibold">
          Presentation
        </label>
        <select
          id="bulletin-format"
          value={format}
          onChange={(event) =>
            setFormat(event.target.value as Format)
          }
          className={fieldClass}
          style={{ width: "auto" }}
        >
          <option value="plain">Plain text</option>
          <option value="editorial-v1">Styled editorial</option>
        </select>
        <input type="hidden" name="bodyFormat" value={format} />
      </div>

      {format === "editorial-v1" && (
        <div
          className="flex flex-wrap gap-2"
          role="toolbar"
          aria-label="Bulletin formatting"
        >
          {tools.map((tool) => (
            <button
              key={tool.label}
              type="button"
              onClick={() => insert(tool.before, tool.after)}
              className="rounded border border-white/25 px-3 py-2 text-xs font-semibold"
            >
              {tool.label}
            </button>
          ))}
        </div>
      )}

      <label className="grid min-w-0 gap-2 text-sm">
        Body
        <textarea
          ref={textarea}
          name="body"
          required
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={BULLETIN_BODY_LIMIT}
          rows={10}
          className={`${fieldClass} resize-y [overflow-wrap:anywhere]`}
        />
      </label>

      <p className="text-xs text-white/70" aria-live="polite">
        {storedLength} / {BULLETIN_BODY_LIMIT} stored characters
        {!withinLimit ? " — exceeds the publication limit" : ""}
      </p>

      <section
        aria-label="Bulletin preview"
        className="min-w-0 rounded border border-white/20 bg-[#f6f0e5] p-4 text-[#222b2e]"
      >
        <h3 className="mb-4 border-b border-[#c8b89a] pb-2 text-xs font-semibold uppercase tracking-wider">
          Publication preview
        </h3>

        {body.trim() ? (
          <BulletinEditorialBody body={previewBody} />
        ) : (
          <p className="text-sm text-[#66563e]">
            Begin writing to preview the bulletin.
          </p>
        )}
      </section>

      {!withinLimit && (
        <p role="alert" className="text-sm text-amber-200">
          Shorten the notice before saving.
        </p>
      )}
    </div>
  );
}
