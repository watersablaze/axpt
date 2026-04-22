type Props = {
  status: "healthy" | "watch" | "critical";
};

export default function TreasuryPulseBadge({ status }: Props) {
  const label =
    status === "healthy"
      ? "Healthy"
      : status === "watch"
      ? "Watch"
      : "Critical";

  const classes =
    status === "healthy"
      ? "border-emerald-700/40 text-emerald-300 bg-emerald-950/40"
      : status === "watch"
      ? "border-amber-700/40 text-amber-300 bg-amber-950/40"
      : "border-red-700/40 text-red-300 bg-red-950/40";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${classes}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      Treasury Pulse {label}
    </div>
  );
}