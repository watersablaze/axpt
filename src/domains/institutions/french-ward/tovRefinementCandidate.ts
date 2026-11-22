import {renderTovRepresentativeCopy} from "./tovRepresentativeCopy";
/** Compatibility entry point: the candidate and released revision use the same renderer. */
export function renderTovRefinementCandidate(copy:{displayName:string;docketReference:string;packageReference:string}) {
  return renderTovRepresentativeCopy(copy.displayName);
}
