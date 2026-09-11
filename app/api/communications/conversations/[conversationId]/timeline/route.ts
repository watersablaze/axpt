import { getPrincipal } from "@/domains/auth/getPrincipal";

import { communicationHttpError } from "@/domains/communications/http/communicationHttpError";

import { loadConversationTimeline } from "@/domains/communications/timeline/loadConversationTimeline";

export const dynamic = "force-dynamic";

function parseOptionalNumericQueryValue(
  value: string | null,
): number | undefined {
  if (value === null) {
    return undefined;
  }

  return Number(value);
}

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      conversationId: string;
    }>;
  },
) {
  const principal = await getPrincipal();

  if (!principal) {
    return Response.json(
      {
        ok: false,

        error: "COMMUNICATIONS_AUTHENTICATION_REQUIRED",
      },
      {
        status: 401,
      },
    );
  }

  const { conversationId } = await params;

  const url = new URL(request.url);

  const messageLimit = parseOptionalNumericQueryValue(
    url.searchParams.get("messageLimit"),
  );

  const reflectionLimit = parseOptionalNumericQueryValue(
    url.searchParams.get("reflectionLimit"),
  );

  try {
    const timeline = await loadConversationTimeline({
      principal,

      conversationId,

      messageLimit,

      reflectionLimit,
    });

    return Response.json({
      ok: true,

      timeline,
    });
  } catch (error) {
    return communicationHttpError(error);
  }
}
