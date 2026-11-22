
import { z } from "zod";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import {
  reviewJensWorkspacePreparation,
  sendJensWorkspacePreparation,
} from "@/domains/instruments/representative-program/onboarding/communications/jensWorkspacePreparation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ intakeId: string }> };
const schema = z.object({
  reviewHash: z.string().regex(/^[a-f0-9]{64}$/),
  confirmSend: z.literal(true),
}).strict();

function reply(body: unknown, status = 200) {
  return Response.json(body, {
    status, headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const conflict = [
    "PREPARATION_REVIEW_CHANGED",
    "PREPARATION_ALREADY_SENT_OR_PENDING",
  ].includes(message);
  return reply({ ok: false, error: message.startsWith("PREPARATION_")
    ? message : "PREPARATION_UNAVAILABLE" },
    conflict ? 409 : message === "PREPARATION_NOT_AVAILABLE" ? 404 : 503);
}

export async function GET(_request: Request, context: Context) {
  const principal = await getPrincipal();
  if (!principal) return reply({ ok: false }, 401);
  if (!isAdmin(principal)) return reply({ ok: false }, 403);
  try {
    const { intakeId } = await context.params;
    return reply({ ok: true, review: await reviewJensWorkspacePreparation(intakeId) });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request, context: Context) {
  const principal = await getPrincipal();
  if (!principal) return reply({ ok: false }, 401);
  if (!isAdmin(principal)) return reply({ ok: false }, 403);
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return reply({ ok: false }, 403);
  }
  let body: unknown;
  try { body = await request.json(); }
  catch { return reply({ ok: false }, 400); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return reply({ ok: false }, 400);
  try {
    const { intakeId } = await context.params;
    const delivery = await sendJensWorkspacePreparation({
      intakeId, actorUserId: principal.userId,
      reviewHash: parsed.data.reviewHash,
    });
    return reply({ ok: true, delivery });
  } catch (error) { return failure(error); }
}
