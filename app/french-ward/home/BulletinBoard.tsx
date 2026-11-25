"use client";

import { useState } from "react";
import { BulletinEditorialBody } from "./BulletinEditorialBody";

type BulletinPost = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  urgent: boolean;
  pdfName: string | null;
};

const publicationDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function PublishedDate({ value }: { value: string }) {
  return <time dateTime={value}>{publicationDate.format(new Date(value))}</time>;
}

const linkClass = "rounded-sm px-2 py-1 underline underline-offset-4 focus-visible:outline focus-visible:outline-2";
const bodyClass = "mt-3 max-w-[72ch] whitespace-pre-wrap break-words text-base leading-relaxed";
const quietClass = "mt-2 text-sm text-[#66563e]";

function BulletinPdf({ post }: { post: BulletinPost }) {
  if (!post.pdfName) return null;

  return (
    <div className="mt-4 grid min-w-0 max-w-[72ch] grid-cols-1 items-center gap-3 rounded-sm border border-[#c8b89a] bg-[#f0e7d5] p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[#594c3b]">PDF attachment</p>
        <p className="mt-1 text-sm text-[#222b2e] [overflow-wrap:anywhere]">
          {post.pdfName}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={`/french-ward/bulletin/${encodeURIComponent(post.id)}/pdf?view=1`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View PDF in a new tab"
          className="rounded-sm border border-[#4b352c] px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ backgroundColor: "#4b352c", color: "#fff7e9" }}
        >
          View PDF ↗
        </a>
        <a
          href={`/french-ward/bulletin/${encodeURIComponent(post.id)}/pdf`}
          download
          className="rounded-sm border border-[#806452] px-3 py-2 text-sm font-semibold text-[#33251f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Download PDF
        </a>
      </div>
    </div>
  );
}

export function BulletinBoard({
  posts,
  initialPostId,
  canPublish = false,
}: {
  posts: readonly BulletinPost[];
  initialPostId?: string;
  canPublish?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    initialPostId ?? null,
  );
  const [linkState, setLinkState] = useState<"idle" | "copied" | "failed">("idle");
  const [latest] = posts;
  const requestedId = selectedId;
  const requestedPost = requestedId
    ? posts.find((post) => post.id === requestedId)
    : undefined;
  const requestedPostMissing =
    Boolean(requestedId) && !requestedPost;
  const selected = requestedId ? requestedPost : latest;
  const welcome = posts.find((post) => post.title === "Welcome Post");
  const urgent = posts.filter((post) => post.urgent);

  function openPost(id: string) {
    if (!posts.some((post) => post.id === id)) return;
    setSelectedId(id);
    setLinkState("idle");

    const url = new URL(window.location.href);
    url.searchParams.set("module", "bulletin");
    url.searchParams.set("post", id);
    window.history.replaceState(
      window.history.state,
      "",
      url.pathname + url.search + url.hash,
    );

    const reader = document.getElementById("bulletin-latest");
    reader?.focus({ preventScroll: true });
    reader?.closest<HTMLElement>("[data-fw-workspace-center]")?.scrollTo({
      top: 0,
      behavior: "instant",
    });
    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }


  async function copyPostLink() {
    if (!selected) return;
    const url = new URL("/french-ward/home", window.location.origin);
    url.searchParams.set("module", "bulletin");
    url.searchParams.set("post", selected.id);
    try {
      await navigator.clipboard.writeText(url.toString());
      setLinkState("copied");
    } catch {
      setLinkState("failed");
    }
  }

  return (
    <div data-bulletin-board data-bulletin-index-layout className="min-w-0 overflow-hidden rounded-sm border border-[#d4c7ad] bg-[#f7f2e8] pb-0 text-[#222b2e]" style={{ display: "block" }}>
      <header className="border-b border-[#c8b89a] bg-[#eae0cd] px-5 pb-6 pt-7 sm:px-8 sm:pt-9">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#63553f]">
          <span>French-Ward / Institutional Communications</span>
          <span>Officers' Edition</span>
        </div>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <p className="font-serif text-4xl leading-tight text-[#20313a] sm:text-5xl">The Bulletin</p>
            <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-[#5b564a]">
              Notices, perspectives and matters requiring the attention of our institutional field.
            </p>
          </div>
          {canPublish && (
            <div className="flex flex-wrap gap-2" aria-label="Publisher actions">
              <a href="/admin/french-ward/bulletin" className="inline-flex items-center rounded-sm bg-[#293a41] px-4 py-2.5 text-sm font-semibold text-[#f7f0e3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                Compose notice
              </a>
              <a href="/admin/french-ward/bulletin#bulletin-drafts" className="inline-flex items-center rounded-sm border border-[#86785e] px-4 py-2.5 text-sm font-semibold text-[#293a41] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                Manage drafts
              </a>
            </div>
          )}
        </div>
      </header>
      <nav aria-label="Bulletin Board sections" className="flex flex-wrap items-center gap-4 border-b border-[#d4c7ad] bg-[#f7f2e8] px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#504431] sm:px-8">
        <a href="#bulletin-urgent" className={linkClass}>Priority</a>
        {latest && (
          <button type="button" className={`${linkClass} cursor-pointer`} onClick={() => openPost(latest.id)}>
            Latest
          </button>
        )}
        <a href="#bulletin-updates" className={linkClass}>Archive</a>
      </nav>
      <div className="grid min-w-0 grid-cols-1 gap-0 bg-[#f7f2e8] xl:grid-cols-[minmax(0,1fr)_minmax(220px,29%)]">


      <section
        id="bulletin-latest"
        tabIndex={-1}
        aria-labelledby="bulletin-reading-title"
        data-welcome-reading={selected && welcome?.id === selected.id ? "" : undefined}
        className="min-w-0 border-b border-[#d4c7ad] px-5 pb-12 pt-9 sm:px-8 sm:pt-12 xl:border-b-0 xl:border-r"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm text-[#66563e]">
          <h2 id="bulletin-reading-title" className="text-sm font-semibold" style={{ color: "#504431" }}>
            {selected ? (selected.id === latest?.id ? "Current Dispatch" : "From the Archive") : "Current Dispatch"}
          </h2>
          {selected && <PublishedDate value={selected.publishedAt} />}
        </div>
        {selected ? (
          <article className="mt-7 max-w-[76ch]">
            <h3 className="break-words font-serif text-3xl font-semibold leading-tight sm:text-4xl" style={{ color: "#162c34" }}>
              {selected.title}
            </h3>
            <div className={bodyClass}>
              <BulletinEditorialBody body={selected.body} />
            </div>
            <BulletinPdf post={selected} />
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[#c8b89a] pt-5">
              <button type="button" onClick={copyPostLink}
                className="rounded-sm border border-[#6a5d49] bg-[#f0e7d5] px-4 py-2 text-sm font-semibold text-[#293a41] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                Copy notice link
              </button>
              <span role="status" aria-live="polite" className="text-xs text-[#5b564a]">
                {linkState === "copied" ? "Link copied — share with an authorized officer." : linkState === "failed" ? "Clipboard unavailable. Use Open link to copy the URL." : "Individual notice · restricted to authorized readers"}
              </span>
              <a className="text-sm underline underline-offset-4"
                href={`/french-ward/home?module=bulletin&post=${encodeURIComponent(selected.id)}`}>
                Open link
              </a>
            </div>
          </article>
        ) : requestedPostMissing ? (
          <p role="status" className={quietClass}>
            The requested bulletin is unavailable or is no longer published.
            Select another available update from the index.
          </p>
        ) : (
          <p className={quietClass}>No updates published yet.</p>
        )}
      </section>

      <aside data-bulletin-rail aria-label="Priority notices and archive" className="min-w-0 bg-[#efe6d4] xl:border-l xl:border-[#ded0b7]">
        <section id="bulletin-urgent" aria-labelledby="bulletin-urgent-title" className="border-b border-[#c8b89a] px-5 py-6 sm:px-8">
          <h2 id="bulletin-urgent-title" className="text-sm font-semibold" style={{ color: "#733c27" }}>
            Priority Notices
          </h2>
          {urgent.length ? (
            <ul className="mt-2 divide-y divide-[#c8b89a]">
              {urgent.map((post) => (
                <li key={post.id}>
                  <button
                    type="button"
                    onClick={() => openPost(post.id)}
                    className="cursor-pointer py-2 text-left text-sm font-semibold underline underline-offset-4 [overflow-wrap:anywhere]"
                  >
                    {post.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={quietClass}>Nothing urgent right now.</p>
          )}
        </section>

        {welcome && (
          <button
            type="button"
            data-bulletin-welcome
            className="w-full cursor-pointer text-left text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={() => openPost(welcome.id)}
          >
            Read the welcome post
          </button>
        )}

        <section id="bulletin-updates" aria-labelledby="bulletin-updates-title" className="px-5 py-7 sm:px-8">
          <h2 id="bulletin-updates-title" className="text-sm font-semibold" style={{ color: "#243a48" }}>
            Notice Archive
          </h2>
          {posts.length ? (
            <ul data-bulletin-index aria-labelledby="bulletin-updates-title" tabIndex={0}>
              {posts.map((post) => (
                <li key={post.id}>
                  <button
                    type="button"
                    aria-current={selected?.id === post.id ? "true" : undefined}
                    onClick={() => openPost(post.id)}
                  >
                    <span className="font-semibold">{post.title}</span>
                    <span className="block text-xs text-[#465d6a]">
                      <PublishedDate value={post.publishedAt} />
                      {post.urgent && <span className="ml-2 text-[#733c27]">Urgent</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={quietClass}>Published updates will appear here.</p>
          )}
        </section>
      </aside>
      </div>
    </div>
  );
}
