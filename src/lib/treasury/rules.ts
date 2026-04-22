export const TREASURY_RULES = {
  lowGasEth: {
    operations: 0.01,
    treasury: 0.005,
    dev: 0.02,
  },
  largeTransferUsdt: {
    warning: 1000,
    critical: 10000,
  },
  approvedCounterparties: [
    // lowercase addresses
    // "0xabc...",
  ],
} as const;