type Props = {
  verificationToken?: string;
};

export function EscrowAuthorizationSuccess({ verificationToken }: Props) {
  return (
    <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-lg p-4 space-y-3">
      <div className="text-sm font-medium text-emerald-200">
        Escrow Authorization Complete
      </div>

      <p className="text-xs text-emerald-200/80 leading-relaxed">
        This case has completed all procedural verification gates.
        Escrow handoff has been authorized and the case is now locked.
      </p>

      <p className="text-[11px] text-emerald-200/60 leading-relaxed">
        AXPT’s role is limited to verification. No funds are held, transferred,
        or controlled by AXPT.
      </p>

      {verificationToken && (
        <div className="pt-2 text-[11px] text-emerald-200/70">
          <strong>Escrow Verification Reference:</strong>
          <br />
          <code className="break-all">{verificationToken}</code>
        </div>
      )}
    </div>
  );
}