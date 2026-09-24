import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonNoStore(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export async function GET(request: Request) {
  const principal = await getPrincipal();
  if (!principal) {
    return jsonNoStore({ ok: false, error: "UNAUTHORIZED" }, 401);
  }
  if (!isAdmin(principal)) {
    return jsonNoStore({ ok: false, error: "FORBIDDEN" }, 403);
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 100) {
    return jsonNoStore({ ok: false, error: "INVALID_SEARCH_QUERY" }, 400);
  }

  try {
    const actor = await prisma.user.findUnique({
      where: { id: principal.userId },
      select: { isAdmin: true },
    });
    if (!actor?.isAdmin) {
      return jsonNoStore({ ok: false, error: "FORBIDDEN" }, 403);
    }

    const intakes = await prisma.representativeOnboardingIntake.findMany({
      where: {
        OR: [
          { reference: { contains: query, mode: "insensitive" } },
          { candidateDisplayName: { contains: query, mode: "insensitive" } },
          { candidateEmail: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        reference: true,
        candidateDisplayName: true,
        candidateEmail: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return jsonNoStore({ ok: true, intakes }, 200);
  } catch (error) {
    console.error("[ARP_ADMIN_INTAKE_SEARCH_FAILED]", error);
    return jsonNoStore({ ok: false, error: "INTAKE_SEARCH_FAILED" }, 500);
  }
}
