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
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function PublishedDate({ value }: { value: string }) {
  return <time dateTime={value}>{publicationDate.format(new Date(value))}</time>;
}

function BulletinPdf({ post }: { post: BulletinPost }) {
  if (!post.pdfName) return null;

  return (
    <div className="mt-6 flex min-w-0 flex-wrap items-center justify-between gap-3 border-y border-[#d9dedb] py-3 text-sm">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[#59676b]">Attached document</p>
        <p className="mt-1 break-all text-[#26353b]">{post.pdfName}</p>
      </div>
      <div className="flex flex-wrap gap-4">
        <a href={`/french-ward/bulletin/${encodeURIComponent(post.id)}/pdf?view=1`}
          target="_blank" rel="noopener noreferrer" aria-label="View PDF in a new tab"
          className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2">View PDF</a>
        <a href={`/french-ward/bulletin/${encodeURIComponent(post.id)}/pdf`}
          download className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2">Download</a>
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
  const [selectedId, setSelectedId] = useState<string | null>(initialPostId ?? null);
  const [linkState, setLinkState] = useState<"idle" | "copied" | "failed">("idle");
  const [latest] = posts;
  const requestedPost = selectedId ? posts.find((post) => post.id === selectedId) : undefined;
  const requestedPostMissing = Boolean(selectedId) && !requestedPost;
  const selected = selectedId ? requestedPost : latest;
  const urgent = posts.filter((post) => post.urgent);

  function openPost(id: string) {
    if (!posts.some((post) => post.id === id)) return;
    setSelectedId(id);
    setLinkState("idle");

    const url = new URL(window.location.href);
    url.searchParams.set("module", "bulletin");
    url.searchParams.set("post", id);
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);

    const reader = document.getElementById("bulletin-latest");
    reader?.focus({ preventScroll: true });
    reader?.closest<HTMLElement>("[data-fw-workspace-center]")?.scrollTo({
      top: 0,
      behavior: "instant",
    });
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "instant" });
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
    <div data-fw-bulletin-posts className="min-w-0 overflow-hidden border border-[#c9d1d2] bg-[#f9faf8] text-[#26343a]" style={{ display: "block" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8dede] bg-[#f0f3f1] px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-sm font-semibold">Published notices</span>
          <span className="text-xs text-[#647278]">{posts.length} {posts.length === 1 ? "post" : "posts"}</span>
        </div>
        {canPublish && (
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold" aria-label="Publisher actions">
            <a href="/admin/french-ward/bulletin" className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2">
              Compose notice
            </a>
            <a href="/admin/french-ward/bulletin#bulletin-drafts" className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2">
              Manage drafts
            </a>
          </div>
        )}
      </div>

      <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[minmax(200px,30%)_minmax(0,1fr)]">
        <aside aria-label="Bulletin post index" className="min-w-0 border-b border-[#d8dede] bg-[#f5f7f5] lg:border-b-0 lg:border-r">
          <section id="bulletin-updates" aria-labelledby="bulletin-updates-title" className="min-w-0">
            <div className="flex items-center justify-between border-b border-[#e1e5e3] px-4 py-3 sm:px-5">
              <h2 id="bulletin-updates-title" className="text-xs font-semibold text-[#48585d]">Notice Archive</h2>
              {latest && (
                <button type="button" onClick={() => openPost(latest.id)}
                  className="text-xs underline underline-offset-4 focus-visible:outline focus-visible:outline-2">Latest</button>
              )}
            </div>
            {posts.length ? (
              <ul data-bulletin-index aria-labelledby="bulletin-updates-title"
                className="max-h-[40vh] overflow-y-auto lg:max-h-[70vh]">
                {posts.map((post) => (
                  <li key={post.id} className="border-b border-[#e2e7e5] last:border-b-0">
                    <button type="button"
                      aria-current={selected?.id === post.id ? "true" : undefined}
                      onClick={() => openPost(post.id)}
                      className={`block w-full border-l-[3px] px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] sm:px-5 ${selected?.id === post.id
                        ? "border-l-[#53747d] bg-[#e7eeee]"
                        : "border-l-transparent hover:bg-[#edf2ef]"}`}>
                      <span className="block break-words text-sm font-medium leading-snug">{post.title}</span>
                      <span className="mt-1 block text-xs text-[#65767b]">
                        <PublishedDate value={post.publishedAt} />
                        {post.urgent && <span className="ml-2 font-semibold text-[#874d37]">Priority</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-5 text-sm text-[#647278] sm:px-5">No published posts.</p>
            )}
          </section>
          {urgent.length > 0 && (
            <section id="bulletin-urgent" aria-labelledby="bulletin-urgent-title"
              className="border-t border-[#d8dede] px-4 py-4 sm:px-5">
              <h2 id="bulletin-urgent-title" className="text-xs font-semibold text-[#874d37]">
                Priority notices
              </h2>
              <ul className="mt-2 space-y-2">
                {urgent.map((post) => (
                  <li key={post.id}>
                    <button type="button" onClick={() => openPost(post.id)}
                      className="text-left text-sm underline underline-offset-4 focus-visible:outline focus-visible:outline-2">
                      {post.title}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        <section id="bulletin-latest" tabIndex={-1} aria-labelledby="bulletin-reading-title"
          className="min-w-0 px-4 pb-9 pt-5 sm:px-7 sm:pt-7">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#dce2e0] pb-3 text-xs text-[#657278]">
            <h2 id="bulletin-reading-title" className="font-semibold text-[#46585e]">
              {selected ? "Notice" : "Reading area"}
            </h2>
            {selected && <PublishedDate value={selected.publishedAt} />}
          </div>

          {selected ? (
            <article className="mt-5 min-w-0 max-w-[74ch]">
              <h3 className="break-words text-xl font-semibold leading-snug tracking-[-0.015em] text-[#26343a] sm:text-2xl">
                {selected.title}
              </h3>
              <div className="mt-5 min-w-0 break-words text-[15px] leading-[1.7] text-[#29383d]">
                <BulletinEditorialBody body={selected.body} />
              </div>
              <BulletinPdf post={selected} />
              <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#dce2e0] pt-4">
                <button type="button" onClick={copyPostLink}
                  className="text-xs font-semibold underline underline-offset-4 focus-visible:outline focus-visible:outline-2">
                  Copy notice link
                </button>
                <a href={`/french-ward/home?module=bulletin&post=${encodeURIComponent(selected.id)}`}
                  className="text-xs underline underline-offset-4 focus-visible:outline focus-visible:outline-2">Open link</a>
                <span role="status" aria-live="polite" className="text-xs text-[#657278]">
                  {linkState === "copied"
                    ? "Link copied — share with an authorized officer."
                    : linkState === "failed"
                      ? "Clipboard unavailable. Use Open link to copy the URL."
                      : "Authorized readers only"}
                </span>
              </div>
            </article>
          ) : requestedPostMissing ? (
            <p role="status" className="mt-5 text-sm text-[#657278]">
              The requested bulletin is unavailable or is no longer published.
              Select another available update from the index.
            </p>
          ) : (
            <p className="mt-5 text-sm text-[#657278]">Select a post to read.</p>
          )}
        </section>
      </div>
    </div>
  );
}
