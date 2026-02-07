import { VerificationItem, Artifact } from '@prisma/client';

type Props = {
  item: VerificationItem & {
    artifact?: Artifact | null;
  };
};

export function VerificationItemRow({ item }: Props) {
  const hasArtifact = !!item.artifact;

  return (
    <li className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
      <div>
        <div>{item.description}</div>

        {hasArtifact ? (
          <div className="text-xs text-white/50 mt-1">
            📎 Document uploaded
          </div>
        ) : (
          <div className="text-xs text-yellow-400 mt-1">
            Upload required
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-white/60">
          {item.status}
        </span>

        {/* Stubbed button — no handler yet */}
        {!hasArtifact && (
          <button
            disabled
            className="text-xs px-2 py-1 rounded border border-white/20 text-white/40 cursor-not-allowed"
          >
            Upload
          </button>
        )}
      </div>
    </li>
  );
}