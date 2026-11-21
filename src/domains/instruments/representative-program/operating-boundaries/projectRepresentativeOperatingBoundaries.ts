import {
  REPRESENTATIVE_OPERATING_BOUNDARIES,
} from "./canonicalRepresentativeOperatingBoundaries";

import {
  assertRepresentativeOperatingBoundaries,
  type RepresentativeOperatingBoundariesProjection,
} from "./contracts";

/**
 * Representative-safe projection.
 *
 * The projection describes policy but does not evaluate live authority.
 * Live authority must continue through the ARP authority kernel.
 */
export function projectRepresentativeOperatingBoundaries():
  RepresentativeOperatingBoundariesProjection {
  const projection = {
    ...REPRESENTATIVE_OPERATING_BOUNDARIES,

    boundaries:
      REPRESENTATIVE_OPERATING_BOUNDARIES
        .boundaries
        .map((boundary) => ({
          ...boundary,
        })),
  };

  assertRepresentativeOperatingBoundaries(
    projection,
  );

  return projection;
}
