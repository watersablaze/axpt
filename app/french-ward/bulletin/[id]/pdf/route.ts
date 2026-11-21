import { getPrincipal } from "@/domains/auth/getPrincipal";
import { PERMISSIONS } from "@/domains/auth/permissions";
import {
  loadCurrentFrenchWardGoverningStandingWithClient,
} from "@/domains/institutions/french-ward/governance/loadCurrentFrenchWardGoverningStandingWithClient";
import { prisma } from "@/infrastructure/db/prisma";

const privateHeaders = { "Cache-Control": "private, no-store" };

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const principal = await getPrincipal();
  if (!principal) return new Response(null, { status: 404, headers: privateHeaders });

  const standing = await loadCurrentFrenchWardGoverningStandingWithClient({
    client: prisma,
    userId: principal.userId,
  });
  if (
    !standing?.active &&
    !principal.permissions.includes(PERMISSIONS.FRENCH_WARD_BULLETIN_PUBLISH)
  ) {
    return new Response(null, { status: 404, headers: privateHeaders });
  }

  const { id } = await params;
  const post = await prisma.frenchWardBulletinPost.findFirst({
    where: { id, publishedAt: { not: null } },
    select: { pdfName: true, pdfBytes: true },
  });
  if (!post?.pdfBytes || !post.pdfName) {
    return new Response(null, { status: 404, headers: privateHeaders });
  }

  const filename = post.pdfName.replace(/[^a-zA-Z0-9._ -]/g, "_");
  const disposition = new URL(request.url).searchParams.get("view") === "1"
    ? "inline"
    : "attachment";

  return new Response(Uint8Array.from(post.pdfBytes), {
    headers: {
      ...privateHeaders,
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
