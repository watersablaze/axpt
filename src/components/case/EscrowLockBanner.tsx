type Props = {
  status: string;
};

export function EscrowLockBanner({ status }: Props) {
  if (status !== 'ESCROW_INITIATED') return null;

  return (
    <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-lg p-4 space-y-2">
      <div className="text-sm font-medium text-emerald-200">
        Escrow Authorization Completed
      </div>

      <p className="text-xs text-emerald-200/80 leading-relaxed">
        This case has completed AXPT’s procedural verification process and
        has been formally handed off for escrow review.
      </p>

      <p className="text-[11px] text-emerald-200/60 leading-relaxed">
        The case is now locked and read-only.
        AXPT does not custody funds, execute transactions,
        or provide settlement instructions.
      </p>
    </div>
  );
}