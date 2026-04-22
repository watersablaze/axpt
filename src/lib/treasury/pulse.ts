import { getTreasurySnapshot } from "./monitor";
import { getUsdtTransfers } from "./transfers";
import { TREASURY_WALLETS } from "./config";
import { TREASURY_RULES } from "./rules";
import { emitTransferEvents } from "./emitTreasuryEvents"
import { matchTransferToEscrow } from "./escrowMatcher"

export type TreasuryAlert = {
  id: string;
  level: "info" | "warning" | "critical";
  code:
    | "NEW_INFLOW"
    | "NEW_OUTFLOW"
    | "LOW_GAS"
    | "LARGE_TRANSFER"
    | "UNEXPECTED_COUNTERPARTY";
  title: string;
  message: string;
  walletId?: string;
  txHash?: string;
  createdAt: string;
};

export type TreasuryPulse = {
  ok: true;
  generatedAt: string;
  snapshot: Awaited<ReturnType<typeof getTreasurySnapshot>>;
  alerts: TreasuryAlert[];
  health: {
    status: "healthy" | "watch" | "critical";
    reasons: string[];
  };
};

function makeAlert(
  partial: Omit<TreasuryAlert, "id" | "createdAt">
): TreasuryAlert {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

export async function getTreasuryPulse(): Promise<TreasuryPulse> {
  const snapshot = await getTreasurySnapshot();
  const alerts: TreasuryAlert[] = [];
  const reasons: string[] = [];

  // 1. low gas checks
  for (const wallet of snapshot.wallets) {
    const eth = Number(wallet.eth);
    const threshold = TREASURY_RULES.lowGasEth[wallet.role];

    if (eth < threshold) {
      alerts.push(
        makeAlert({
          level: wallet.role === "operations" ? "warning" : "info",
          code: "LOW_GAS",
          title: `Low gas on ${wallet.name}`,
          message: `${wallet.name} has ${wallet.eth} ETH, below threshold ${threshold}.`,
          walletId: wallet.id,
        })
      );
      reasons.push(`Low gas: ${wallet.name}`);
    }
  }

  // 2. recent operations transfers
  const operationsWallet = TREASURY_WALLETS.find(
    (w) => w.role === "operations"
  );

if (operationsWallet) {
  const transfers = await getUsdtTransfers(operationsWallet.address)

  // 🔥 NEW — emit into system
  await emitTransferEvents(operationsWallet.id, transfers)

    for (const tx of transfers.slice(0, 5)) {
      const amount = Number(tx.amount);

        await matchTransferToEscrow(operationsWallet.id, tx)

      if (tx.direction === "in") {
        alerts.push(
          makeAlert({
            level: "info",
            code: "NEW_INFLOW",
            title: "New USDT inflow",
            message: `${tx.amount} USDT received into AXPT Operations.`,
            walletId: operationsWallet.id,
            txHash: tx.txHash,
          })
        );
      }

      if (tx.direction === "out") {
        alerts.push(
          makeAlert({
            level: "warning",
            code: "NEW_OUTFLOW",
            title: "New USDT outflow",
            message: `${tx.amount} USDT sent from AXPT Operations.`,
            walletId: operationsWallet.id,
            txHash: tx.txHash,
          })
        );
      }

      if (amount >= TREASURY_RULES.largeTransferUsdt.critical) {
        alerts.push(
          makeAlert({
            level: "critical",
            code: "LARGE_TRANSFER",
            title: "Critical-size transfer detected",
            message: `${tx.amount} USDT exceeds critical threshold.`,
            walletId: operationsWallet.id,
            txHash: tx.txHash,
          })
        );
        reasons.push("Critical-size transfer detected");
      } else if (amount >= TREASURY_RULES.largeTransferUsdt.warning) {
        alerts.push(
          makeAlert({
            level: "warning",
            code: "LARGE_TRANSFER",
            title: "Large transfer detected",
            message: `${tx.amount} USDT exceeds warning threshold.`,
            walletId: operationsWallet.id,
            txHash: tx.txHash,
          })
        );
        reasons.push("Large transfer detected");
      }

      const approved = TREASURY_RULES.approvedCounterparties;
      const counterparty =
        tx.direction === "in" ? tx.from.toLowerCase() : tx.to.toLowerCase();

      if (
        approved.length > 0 &&
        !approved.includes(counterparty as never)
      ) {
        alerts.push(
          makeAlert({
            level: "warning",
            code: "UNEXPECTED_COUNTERPARTY",
            title: "Unexpected counterparty",
            message: `Transfer involved unapproved address ${counterparty.slice(
              0,
              10
            )}...`,
            walletId: operationsWallet.id,
            txHash: tx.txHash,
          })
        );
        reasons.push("Unexpected counterparty");
      }
    }
  }

  const hasCritical = alerts.some((a) => a.level === "critical");
  const hasWarning = alerts.some((a) => a.level === "warning");

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    snapshot,
    alerts,
    health: {
      status: hasCritical ? "critical" : hasWarning ? "watch" : "healthy",
      reasons,
    },
  };
}