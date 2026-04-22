type Alert = {
  id: string;
  level: "info" | "warning" | "critical";
  code: string;
  title: string;
  message: string;
  txHash?: string;
  createdAt: string;
};

type Props = {
  alerts: Alert[];
};

export default function TreasuryAlertsPanel({ alerts }: Props) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden">
      <div className="border-b border-neutral-800 px-5 py-4">
        <h2 className="text-lg font-medium">Pulse Alerts</h2>
      </div>

      <div className="divide-y divide-neutral-800">
        {alerts.length === 0 ? (
          <div className="px-5 py-6 text-sm text-neutral-400">
            No current alerts.
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{alert.title}</p>
                  <p className="mt-1 text-sm text-neutral-400">
                    {alert.message}
                  </p>
                  {alert.txHash ? (
                    <p className="mt-2 font-mono text-xs text-neutral-500">
                      {alert.txHash}
                    </p>
                  ) : null}
                </div>

                <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  {alert.level}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}