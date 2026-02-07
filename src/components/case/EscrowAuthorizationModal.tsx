'use client';

type Props = {
  open: boolean;
  onCancel: () => void;
  caseId: string;
  verificationToken?: string | null;
};

export function EscrowAuthorizationModal({
  open,
  onCancel,
  caseId,
  verificationToken,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-black border border-white/10 rounded-lg p-6 max-w-md w-full space-y-4">
        <h2 className="text-lg font-medium text-white">
          Escrow Handoff Authorized
        </h2>

        <p className="text-sm text-white/70 leading-relaxed">
          The escrow handoff packet has been generated and sealed.
          <br />
          This case is now locked and read-only.
        </p>

        <div className="space-y-2">
          {verificationToken ? (
            <a
              href={`/verify/escrow/${verificationToken}`}
              target="_blank"
              className="block text-center text-sm px-4 py-2 rounded bg-emerald-600/20 hover:bg-emerald-600/30"
            >
              View Public Verification
            </a>
          ) : (
            <a
              href={`/api/axpt/cases/${caseId}/handoff/escrow`}
              className="block text-center text-sm px-4 py-2 rounded bg-emerald-600/20 hover:bg-emerald-600/30"
            >
              Download Escrow Handoff Packet
            </a>
          )}
        </div>

        <div className="text-xs text-white/40 leading-snug">
          AXPT provides procedural verification only and does not act as an escrow agent.
        </div>

        <button
          onClick={onCancel}
          className="text-xs text-white/60 hover:text-white"
        >
          Close
        </button>
      </div>
    </div>
  );
}
