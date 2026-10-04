import type {
  SourceAuthorityPresentationAudience,
  SourceAuthorityPresentationProjection,
} from "./contracts";

import {
  deriveSourceAuthorityPresentation,
} from "./deriveSourceAuthorityPresentation";

import {
  loadSourceAuthorityCanonicalStateWithClient,
  type SourceAuthorityPresentationLoaderClient,
} from "./loadSourceAuthorityCanonicalStateWithClient";

/**
 * Application-service boundary for governed Source Authority presentation.
 *
 * This service deliberately owns only:
 *
 *   LOAD → DERIVE → RETURN
 *
 * It does not determine workspace availability, representative standing,
 * appointment state, delegated authority, access policy, CUP composition,
 * route behavior, or UI presentation.
 */
export async function loadSourceAuthorityPresentationWithClient(
  params: Readonly<{
    client:
      SourceAuthorityPresentationLoaderClient;

    instrumentReference:
      string;

    audience:
      SourceAuthorityPresentationAudience;
  }>,
): Promise<
  SourceAuthorityPresentationProjection
> {
  const canonical =
    await loadSourceAuthorityCanonicalStateWithClient({
      client:
        params.client,

      instrumentReference:
        params.instrumentReference,
    });

  return deriveSourceAuthorityPresentation({
    audience:
      params.audience,

    canonical,
  });
}
