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

async function saveDraft(formData: FormData) {
  "use server";
  const principal = await requirePublisher();
  const title = formData.get("title");
  const body = formData.get("body");

  if (
    typeof title !== "string" || !title.trim() || title.length > 160 ||
    typeof body !== "string" || !body.trim() || body.length > 12000
  ) {
    redirect(`${editorPath}?error=invalid-draft`);
  }

  await prisma.frenchWardBulletinPost.create({
    data: { title: title.trim(), body: body.trim(), authorUserId: principal.userId },
  });
  revalidatePath(editorPath);
  redirect(editorPath);
}

async function publishDraft(formData: FormData) {
  "use server";
  await requirePublisher();
  const id = formData.get("id");
  if (typeof id !== "string" || !id || id.length > 128) notFound();

  await prisma.frenchWardBulletinPost.updateMany({
    where: { id, publishedAt: null },
    data: { publishedAt: new Date() },
  });
  revalidatePath("/french-ward/home");
  revalidatePath(editorPath);
  redirect(editorPath);
}

export default async function BulletinEditor({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePublisher();
  const { error } = await searchParams;
  const posts = await prisma.frenchWardBulletinPost.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <h1 className="text-3xl font-semibold">French-Ward Bulletin Board</h1>

      <form action={saveDraft} className="grid gap-4 rounded border border-white/20 p-5">
        <h2 className="text-xl font-semibold">New draft</h2>
        {error === "invalid-draft" && (
          <p role="alert">Enter a title and body within the character limits.</p>
        )}
        <label className="grid gap-2">
          Title
          <input name="title" required maxLength={160} className="rounded border border-white/30 bg-transparent p-2" />
        </label>
        <label className="grid gap-2">
          Body
          <textarea name="body" required maxLength={12000} rows={8} className="rounded border border-white/30 bg-transparent p-2" />
        </label>
        <button className="justify-self-start rounded border border-white/30 px-4 py-2">
          Save draft
        </button>
      </form>

      <section className="space-y-4" aria-label="Bulletin posts">
        <h2 className="text-xl font-semibold">Posts</h2>
        {posts.length === 0 && <p>No posts yet.</p>}
        {posts.map((post) => (
          <article key={post.id} className="space-y-3 rounded border border-white/20 p-5">
            <h3 className="break-words text-lg font-semibold">{post.title}</h3>
            <p>{post.publishedAt ? "Published" : "Draft"}</p>
            <p className="whitespace-pre-wrap break-words">{post.body}</p>
            {!post.publishedAt && (
              <form action={publishDraft}>
                <input type="hidden" name="id" value={post.id} />
                <button className="rounded border border-white/30 px-4 py-2">Publish</button>
              </form>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
