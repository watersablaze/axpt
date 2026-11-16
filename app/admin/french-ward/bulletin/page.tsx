import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { prisma } from "@/infrastructure/db/prisma";

const editorPath = "/admin/french-ward/bulletin";

async function requirePublisher() {
  const principal = await getPrincipal();
  if (!principal) redirect(`/login?next=${encodeURIComponent(editorPath)}`);
  if (!principal.permissions.includes(PERMISSIONS.FRENCH_WARD_BULLETIN_PUBLISH)) {
    notFound();
  }
  return principal;
}

async function savePost(
  edit: { id: string; updatedAt: string } | null,
  formData: FormData,
) {
  "use server";
  const principal = await requirePublisher();
  const formPath = edit
    ? `${editorPath}?edit=${encodeURIComponent(edit.id)}`
    : editorPath;
  const errorSeparator = edit ? "&" : "?";
  const title = formData.get("title");
  const body = formData.get("body");

  if (
    typeof title !== "string" || !title.trim() || title.length > 160 ||
    typeof body !== "string" || !body.trim() || body.length > 12000
  ) {
    redirect(`${formPath}${errorSeparator}error=invalid-draft`);
  }

  const pdf = formData.get("pdf");
  let attachment: { pdfName: string; pdfBytes: Uint8Array } | undefined;
  if (pdf instanceof File && pdf.size > 0) {
    const maxBytes = 750 * 1024;
    if (pdf.size < 5 || pdf.size > maxBytes || !pdf.name.toLowerCase().endsWith(".pdf")) {
      redirect(`${formPath}${errorSeparator}error=invalid-pdf`);
    }

    const bytes = new Uint8Array(await pdf.arrayBuffer());
    const signature = new TextDecoder().decode(bytes.subarray(0, 5));
    if (signature !== "%PDF-") {
      redirect(`${formPath}${errorSeparator}error=invalid-pdf`);
    }

    const safeStem = pdf.name.slice(0, -4).replace(/[^a-zA-Z0-9._ -]/g, "_").trim();
    attachment = {
      pdfName: `${safeStem.slice(0, 110) || "attachment"}.pdf`,
      pdfBytes: bytes,
    };
  }

  const data = {
    title: title.trim(),
    body: body.trim(),
    urgent: formData.get("urgent") === "on",
    ...attachment,
  };

  if (edit) {
    const { count } = await prisma.frenchWardBulletinPost.updateMany({
      where: {
        id: edit.id,
        publishedAt: { not: null },
        updatedAt: new Date(edit.updatedAt),
      },
      data,
    });

    if (count === 0) {
      redirect(`${formPath}&error=edit-conflict`);
    }

    revalidatePath("/french-ward/home");
    revalidatePath(editorPath);
    redirect(`${editorPath}?updated=${encodeURIComponent(edit.id)}`);
  }

  const draft = await prisma.frenchWardBulletinPost.create({
    data: { ...data, authorUserId: principal.userId },
  });
  revalidatePath(editorPath);
  redirect(`${editorPath}?saved=${encodeURIComponent(draft.id)}`);
}

async function publishDraft(formData: FormData) {
  "use server";
  await requirePublisher();
  const id = formData.get("id");
  if (typeof id !== "string" || !id || id.length > 128) notFound();

  const { count } = await prisma.frenchWardBulletinPost.updateMany({
    where: { id, publishedAt: null },
    data: { publishedAt: new Date() },
  });
  if (count === 0) redirect(`${editorPath}?error=draft-unavailable`);
  revalidatePath("/french-ward/home");
  revalidatePath(editorPath);
  redirect(`${editorPath}?published=${encodeURIComponent(id)}`);
}

export default async function BulletinEditor({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    saved?: string;
    published?: string;
    edit?: string;
    updated?: string;
  }>;
}) {
  await requirePublisher();
  const { error, saved, published, edit, updated } = await searchParams;
  const posts = await prisma.frenchWardBulletinPost.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { id: true, title: true, body: true, publishedAt: true, urgent: true, pdfName: true, updatedAt: true },
  });

  const drafts = posts.filter((post) => post.publishedAt === null);
  const publishedPosts = posts.filter((post) => post.publishedAt !== null);
  const savedDraft = drafts.find((post) => post.id === saved);
  const publishedPost = publishedPosts.find((post) => post.id === published);
  const editedPost = publishedPosts.find((post) => post.id === edit);
  const updatedPost = publishedPosts.find((post) => post.id === updated);
  const editTarget = editedPost
    ? { id: editedPost.id, updatedAt: editedPost.updatedAt.toISOString() }
    : null;

  const composerKey = editTarget
    ? `edit-${editTarget.id}-${editTarget.updatedAt}`
    : updatedPost
      ? `updated-${updatedPost.id}-${updatedPost.updatedAt.toISOString()}`
      : publishedPost
        ? `published-${publishedPost.id}`
        : savedDraft ? `saved-${savedDraft.id}` : "new";

  const fieldClass =
    "w-full min-w-0 max-w-full rounded border border-white/25 bg-black/20 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200";
  const cardClass = "min-w-0 rounded-md border border-white/15 bg-white/[.03] p-4 sm:p-5";

  return (
    <main className="mx-auto w-full min-w-0 max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#806452] bg-[#4b352c] px-4 py-4 text-[#fff7e9] sm:px-5">
        <h1 className="text-xl font-semibold">French-Ward Bulletin Board</h1>
        <nav aria-label="Bulletin editor sections" className="flex flex-wrap gap-4 text-sm">
          <a href="#bulletin-drafts" className="underline underline-offset-4">Drafts</a>
          <a href="#bulletin-published" className="underline underline-offset-4">Published</a>
        </nav>
      </header>

      {(savedDraft || publishedPost || updatedPost) && (
        <p role="status" className="rounded border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm [overflow-wrap:anywhere]">
          {updatedPost
            ? `Changes saved and visible to officers: ${updatedPost.title}`
            : publishedPost
              ? `Published to officers: ${publishedPost.title}`
              : `Draft saved: ${savedDraft?.title}`}
        </p>
      )}
      {error === "draft-unavailable" && (
        <p role="alert" className="rounded border border-amber-400/30 px-4 py-3 text-sm">
          This draft is no longer available to publish. Check the Published list.
        </p>
      )}

      {error === "edit-conflict" && (
        <p role="alert" className="rounded border border-amber-400/30 px-4 py-3 text-sm">
          The published post changed while you were editing. Review the current version before saving again.
        </p>
      )}
      {edit && !editedPost && (
        <p role="alert" className="rounded border border-amber-400/30 px-4 py-3 text-sm">
          This published post is no longer available to edit.
        </p>
      )}

      <form
        id="bulletin-composer"
        key={composerKey}
        action={savePost.bind(null, editTarget)}
        autoComplete="off"
        className={`grid grid-cols-1 gap-4 ${cardClass}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {editedPost ? "Edit published post" : "New draft"}
          </h2>
          {editedPost && (
            <a href={editorPath} className="text-sm underline underline-offset-4">
              Cancel edit
            </a>
          )}
        </div>
        {error === "invalid-draft" && (
          <p role="alert" className="text-sm text-amber-200">
            Enter a title and body within the character limits.
          </p>
        )}
        <label className="grid min-w-0 gap-2 text-sm">
          Title
          <input name="title" defaultValue={editedPost?.title} required maxLength={160} className={fieldClass} />
        </label>
        <label className="grid min-w-0 gap-2 text-sm">
          Body
          <textarea
            name="body"
            defaultValue={editedPost?.body}
            required
            maxLength={12000}
            rows={7}
            className={`${fieldClass} resize-y [overflow-wrap:anywhere]`}
          />
        </label>
        {error === "invalid-pdf" && (
          <p role="alert" className="text-sm text-amber-200">Choose a PDF up to 750 KiB.</p>
        )}
        <label className="grid min-w-0 gap-2 rounded border border-white/15 p-3 text-sm">
          {editedPost?.pdfName ? "Replace PDF (optional, up to 750 KiB)" : "Attach PDF (optional, up to 750 KiB)"}
          {editedPost?.pdfName && (
            <span className="text-white/75 [overflow-wrap:anywhere]">
              Current file: {editedPost.pdfName}
            </span>
          )}
          <input
            type="file"
            name="pdf"
            accept=".pdf,application/pdf"
            className="block w-full min-w-0 max-w-full overflow-hidden text-ellipsis text-sm file:mr-2 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-inherit"
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="urgent" defaultChecked={editedPost?.urgent} />
            Mark urgent
          </label>
          <button type="submit" className="rounded bg-[#e8d5b9] px-4 py-2 text-sm font-semibold text-[#33251f]">
            {editedPost ? "Save changes" : "Save draft"}
          </button>
        </div>
      </form>

      <section id="bulletin-drafts" aria-labelledby="bulletin-drafts-title" className="scroll-mt-24 space-y-3">
        <h2 id="bulletin-drafts-title" className="text-lg font-semibold">Drafts ({drafts.length})</h2>
        {!drafts.length && <p className="text-sm text-white/65">No saved drafts.</p>}
        {drafts.map((post) => (
          <article key={post.id} className={`space-y-3 ${cardClass}`}>
            <h3 className="font-semibold [overflow-wrap:anywhere]">{post.title}</h3>
            {post.urgent && <p className="text-sm text-amber-200">Marked urgent</p>}
            <p className="whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">{post.body}</p>
            {post.pdfName && (
              <p className="text-sm text-white/75 [overflow-wrap:anywhere]">Attached PDF: {post.pdfName}</p>
            )}
            <form action={publishDraft}>
              <input type="hidden" name="id" value={post.id} />
              <button type="submit" className="rounded bg-[#e8d5b9] px-4 py-2 text-sm font-semibold text-[#33251f]">
                Publish to officers
              </button>
            </form>
          </article>
        ))}
      </section>

      <section id="bulletin-published" aria-labelledby="bulletin-published-title" className="scroll-mt-24 space-y-3">
        <h2 id="bulletin-published-title" className="text-lg font-semibold">Published ({publishedPosts.length})</h2>
        {!publishedPosts.length && <p className="text-sm text-white/65">No published posts.</p>}
        {publishedPosts.map((post) => (
          <details key={post.id} className={cardClass}>
            <summary className="cursor-pointer text-sm font-semibold [overflow-wrap:anywhere]">
              {post.title}
              {post.urgent && <span className="ml-2 font-normal text-amber-200">Urgent</span>}
              {post.pdfName && <span className="ml-2 font-normal text-white/65">PDF attached</span>}
            </summary>
            <a
              href={`${editorPath}?edit=${encodeURIComponent(post.id)}#bulletin-composer`}
              className="mt-3 inline-block rounded border border-white/25 px-3 py-2 text-sm font-semibold"
            >
              Edit
            </a>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">{post.body}</p>
            {post.pdfName && (
              <p className="mt-3 text-sm text-white/75 [overflow-wrap:anywhere]">Attached PDF: {post.pdfName}</p>
            )}
          </details>
        ))}
      </section>
    </main>
  );
}
